#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the short hash of the commit
COMMIT_SHA=$(git rev-parse HEAD)
SHORT_HASH=$(git rev-parse --short $COMMIT_SHA)

# Push the latest commit if not already pushed
git push origin HEAD

# Fetch tags from the remote repository
git fetch --tags

# Check if the tag already exists on the remote
if git ls-remote --tags origin | grep -q "refs/tags/$SHORT_HASH"; then
  echo "Tag $SHORT_HASH already exists. Skipping tag creation."
else
  # Create a tag with the short hash
  git tag $SHORT_HASH $COMMIT_SHA

  # Push the tag to the remote repository
  git push origin $SHORT_HASH

  echo "Created and pushed tag: $SHORT_HASH"
fi

# Submit the build to Google Cloud Build
# Note: You'll need to create this Cloud Build trigger in your GCP project
TRIGGER_ID=your-nextjs-build-trigger-id

# Build for dev
gcloud builds triggers run $TRIGGER_ID \
  --region=us-central1 \
  --tag="$SHORT_HASH" \
  --substitutions _TAG_NAME="$SHORT_HASH",\
_ENV="dev",\
_NODE_ENV="development",\
_NEXT_PUBLIC_APP_URL="https://nextjs-dev-your-project.us-central1.run.app",\
_NEXTAUTH_URL="https://nextjs-dev-your-project.us-central1.run.app",\
_DATABASE_URL_SECRET_NAME="DATABASE_URL_DEV",\
_NEXTAUTH_SECRET_SECRET_NAME="NEXTAUTH_SECRET_DEV"

# Build for prod
gcloud builds triggers run $TRIGGER_ID \
  --region=us-central1 \
  --tag="$SHORT_HASH" \
  --substitutions _TAG_NAME="$SHORT_HASH",\
_ENV="prod",\
_NODE_ENV="production",\
_NEXT_PUBLIC_APP_URL="https://your-domain.com",\
_NEXTAUTH_URL="https://your-domain.com",\
_DATABASE_URL_SECRET_NAME="DATABASE_URL_PROD",\
_NEXTAUTH_SECRET_SECRET_NAME="NEXTAUTH_SECRET_PROD"

# Print the commit SHA to the console
echo "Build triggered with tag: $SHORT_HASH" 