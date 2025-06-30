#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to print usage information
usage() {
  echo "Usage: $0 -t <tag-name> -e <env>"
  echo "  -t: Tag name (commit hash or version)"
  echo "  -e: Environment (dev or prod)"
  exit 1
}

# Parse the commit SHA and environment from the command line arguments
while getopts "e:t:" opt; do
  case ${opt} in
    e )
      ENV=$OPTARG
      ;;
    t )
      TAG_NAME=$OPTARG
      ;;
    * )
      usage
      ;;
  esac
done

# Check if both tag name and environment are provided
if [ -z "${TAG_NAME}" ] || [ -z "${ENV}" ]; then
  echo "Error: Both tag name and environment must be provided."
  usage
fi

# Determine the service name based on the environment
if [ "${ENV}" == "dev" ]; then
  SERVICE="nextjs-dev"
elif [ "${ENV}" == "prod" ]; then
  SERVICE="nextjs-prod"
else
  echo "Error: Unsupported environment. Only 'dev' or 'prod' are currently supported."
  exit 1
fi

# Push the current branch to GitHub
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$CURRENT_BRANCH"

# Print the parameters
echo "Using tag name: $TAG_NAME"
echo "Using environment: $ENV"
echo "Using service name: $SERVICE"

# Submit the deployment to Google Cloud Build
# Note: You'll need to create this Cloud Build trigger in your GCP project
DEPLOY_TRIGGER_ID=your-nextjs-deploy-trigger-id

gcloud builds triggers run $DEPLOY_TRIGGER_ID \
  --region=us-central1 \
  --tag="$TAG_NAME" \
  --substitutions _TAG_NAME="$TAG_NAME",_ENV="$ENV",_SERVICE="$SERVICE"

# Print confirmation
echo "Deploy triggered with tag: $TAG_NAME, service: $SERVICE" 