#!/bin/bash

if (( $# != 1 ))
then
  echo "Usage: ..."
  exit 1
fi

# Update release version
sed -i '' 's/"version": "[0-9]*\.[0-9]*\.[0-9]*"/"version": "'$1'"/g' package.json
npm install

# Create new commit
git add package.json package-lock.json
git commit -m "Bump to $1"

# Add a tag
git tag $1

printf "\n\n🚇🚇🚇 New Release Ready 🚇🚇🚇\n\n"
printf "The release has been created and tagged. Run the below command with write permissions to master\n\n"
printf "    git push origin master && git push origin $1\n"
