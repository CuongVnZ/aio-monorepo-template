#!/bin/bash

# deploy-image.sh
# deploy an image to cloud run
# usage: ./deploy-image.sh <service> <env> <short-sha>

_SERVICE=$1
_ENV=$2
_TAG=$3

# IF no service/env/tag is provided, exit
if [ -z "${_SERVICE}" ] || [ -z "${_ENV}" ] || [ -z "${_TAG}" ]; then
  echo "Usage: ./deploy-image.sh <service> <env> <short-sha>"
  exit 1
fi

# Get project ID from gcloud config or environment variable
_PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project)}
_SERVICE_NAME="${_SERVICE}-${_ENV}"
_REGION=${GCP_REGION:-"us-central1"}
_IMAGE="${_REGION}-docker.pkg.dev/${_PROJECT_ID}/containers/${_SERVICE_NAME}:${_TAG}"

gcloud run deploy ${_SERVICE_NAME} \
  --image ${_IMAGE} \
  --region ${_REGION} \
  --platform managed \
  --allow-unauthenticated