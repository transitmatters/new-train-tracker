#!/bin/bash

set -e

export AWS_PROFILE=transitmatters
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""

PRODUCTION=false

# Argument parsing
# pass "-p" flag to deploy to production

while getopts "pc" opt; do
    case $opt in
        p)
            PRODUCTION=true
            ;;
  esac
done


$PRODUCTION && ENV_SUFFIX=""                                    || ENV_SUFFIX="-beta"
$PRODUCTION && CHALICE_STAGE="production"                       || CHALICE_STAGE="beta"
$PRODUCTION && STACK_NAME="ntt"                                 || STACK_NAME="ntt-beta"

$PRODUCTION && FRONTEND_ZONE="traintracker.transitmatters.org"  || FRONTEND_ZONE="labs.transitmatters.org"
$PRODUCTION && FRONTEND_CERT_ARN="$TM_NTT_CERT_ARN"             || FRONTEND_CERT_ARN="$TM_LABS_WILDCARD_CERT_ARN"
$PRODUCTION && FRONTEND_DOMAIN_PREFIX=""                        || FRONTEND_DOMAIN_PREFIX="ntt-beta."

BACKEND_ZONE="labs.transitmatters.org"
BACKEND_CERT_ARN="$TM_LABS_WILDCARD_CERT_ARN"
$PRODUCTION && BACKEND_DOMAIN_PREFIX="traintracker-api."        || BACKEND_DOMAIN_PREFIX="ntt-api-beta."

BACKEND_BUCKET=ntt-backend$ENV_SUFFIX
FRONTEND_HOSTNAME=$FRONTEND_DOMAIN_PREFIX$FRONTEND_ZONE # Must match in .chalice/config.json!
BACKEND_HOSTNAME=$BACKEND_DOMAIN_PREFIX$BACKEND_ZONE # Must match in .chalice/config.json!


# Ensure required secrets are set
if [[ -z "$DD_API_KEY" ]]; then
    echo "Must provide DD_API_KEY in environment to deploy" 1>&2
    exit 1
fi

# Identify the version and commit of the current deploy
GIT_VERSION=`git describe --tags --always`
GIT_SHA=`git rev-parse HEAD`
GIT_ABR_VERSION=`git describe --tags --abbrev=0`
echo "Deploying version $GIT_VERSION | $GIT_SHA"

# Adding some datadog tags to get better data
DD_TAGS="git.commit.sha:$GIT_SHA,git.repository_url:github.com/transitmatters/parking-explorer"

npm run build

echo "Deploying Train Tracker CloudFormation stack to $HOSTNAME..."
echo "View stack log here: https://$AWS_REGION.console.aws.amazon.com/cloudformation/home?region=$AWS_REGION"

pushd server/ > /dev/null
poetry export --without-hashes --output requirements.txt
poetry run chalice package --stage $CHALICE_STAGE --merge-template cloudformation.json cfn/
aws cloudformation package --template-file cfn/sam.json --s3-bucket $BACKEND_BUCKET --output-template-file cfn/packaged.yaml
aws cloudformation deploy --stack-name $STACK_NAME \
    --template-file cfn/packaged.yaml \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
    TMFrontendHostname=$FRONTEND_HOSTNAME \
    TMFrontendZone=$FRONTEND_ZONE \
    TMFrontendCertArn=$FRONTEND_CERT_ARN \
    TMBackendCertArn=$BACKEND_CERT_ARN \
    TMBackendHostname=$BACKEND_HOSTNAME \
    TMBackendZone=$BACKEND_ZONE \
    MbtaV3ApiKey=$MBTA_V3_API_KEY \
    DDApiKey=$DD_API_KEY \
    GitVersion=$GIT_VERSION \
    DDTags=$DD_TAGS

popd > /dev/null
aws s3 sync dist/ s3://$FRONTEND_HOSTNAME

# Grab the cloudfront ID and invalidate its cache
CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '$FRONTEND_HOSTNAME')].Id | [0]" --output text)
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
