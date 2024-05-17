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

$PRODUCTION && HOSTNAME="traintracker.transitmatters.org" || HOSTNAME="ntt-beta.labs.transitmatters.org"
$PRODUCTION && DOMAIN="traintracker.transitmatters.org" || DOMAIN="labs.transitmatters.org"
$PRODUCTION && CERT_ARN="$TM_NTT_CERT_ARN" || CERT_ARN="$TM_LABS_WILDCARD_CERT_ARN"

$PRODUCTION && STACK_NAME="ntt" || STACK_NAME="ntt-beta"

# Ensure required secrets are set
if [[ -z "$DD_API_KEY" ]]; then
    echo "Must provide DD_API_KEY in environment to deploy" 1>&2
    exit 1
fi

# Identify the version and commit of the current deploy
export GIT_SHA=`git rev-parse HEAD`
echo "Deploying version $GIT_SHA"

echo "Deploying Train Tracker CloudFormation stack to $HOSTNAME..."
echo "View stack log here: https://$AWS_REGION.console.aws.amazon.com/cloudformation/home?region=$AWS_REGION"

aws cloudformation deploy --stack-name $STACK_NAME \
    --template-file cloudformation.json \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
    NTTHostname=$HOSTNAME \
    NTTDomain=$DOMAIN \
    NTTCertArn=$CERT_ARN

# Look up the physical ID of the EC2 instance currently associated with the stack
INSTANCE_PHYSICAL_ID=$(aws cloudformation list-stack-resources --stack-name $STACK_NAME --query "StackResourceSummaries[?LogicalResourceId=='NTTInstance'].PhysicalResourceId" --output text)

# Run the playbook! :-)
echo "Deploying the New Train Tracker to $INSTANCE_PHYSICAL_ID via Ansible..."
export ANSIBLE_HOST_KEY_CHECKING=False # If it's a new host, ssh known_hosts not having the key fingerprint will cause an error. Silence it
SSH_PROXY_ARGS="-o ProxyCommand='aws ec2-instance-connect open-tunnel --instance-id $INSTANCE_PHYSICAL_ID'"
ansible-galaxy collection install datadog.dd
ansible-playbook -v --ssh-extra-args "$SSH_PROXY_ARGS" -i $INSTANCE_PHYSICAL_ID, -u ubuntu --private-key ~/.ssh/transitmatters-ntt.pem deploy-playbook.yml

# Grab the cloudfront ID and invalidate its cache
CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '$HOSTNAME')].Id | [0]" --output text)
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
