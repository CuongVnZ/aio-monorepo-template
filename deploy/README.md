# Deployment Configuration

This directory contains deployment configurations for the NextJS application using Google Cloud Platform services.

## Overview

The deployment setup provides:

- **Docker containerization** with multi-stage builds
- **Google Cloud Build** for CI/CD pipelines
- **Google Cloud Run** for serverless deployment
- **Multi-environment support** (dev/prod)
- **Secret management** via Google Secret Manager
- **Local development** support with Skaffold

## Directory Structure

```
deploy/
└── nextjs/
    ├── Dockerfile                          # Multi-stage Docker build
    ├── build.sh                           # Build script for creating images
    ├── deploy.sh                          # Deployment script
    ├── cloudbuild-build.yaml             # Cloud Build config for building
    ├── cloudbuild-deploy.yaml            # Cloud Build config for deployment
    ├── cloudrun.skaffold.yaml            # Skaffold config for local dev
    ├── cloudrun.clouddeploy.yaml         # Cloud Deploy pipeline config
    └── cloudrun-manifests/
        ├── nextjs.dev.service.yaml       # Dev environment Cloud Run service
        └── nextjs.prod.service.yaml      # Prod environment Cloud Run service
```

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Required APIs** enabled:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API or Artifact Registry API
   - Secret Manager API
3. **Authentication** set up (gcloud CLI or service account)
4. **Docker** installed for local builds
5. **Skaffold** (optional, for local development)

## Environment Setup

### 1. Create Required Secrets

Create secrets in Google Secret Manager for each environment:

```bash
# Development secrets
echo "your-dev-database-url" | gcloud secrets create DATABASE_URL_DEV --data-file=-
echo "your-dev-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET_DEV --data-file=-

# Production secrets
echo "your-prod-database-url" | gcloud secrets create DATABASE_URL_PROD --data-file=-
echo "your-prod-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET_PROD --data-file=-
```

### 2. Configure Cloud Build Triggers

Create Cloud Build triggers in your GCP project:

#### Build Trigger

```bash
gcloud builds triggers create github \
  --repo-name=worker-template \
  --repo-owner=your-github-org \
  --branch-pattern=".*" \
  --build-config=deploy/nextjs/cloudbuild-build.yaml \
  --description="NextJS build trigger"
```

#### Deploy Trigger

```bash
gcloud builds triggers create github \
  --repo-name=worker-template \
  --repo-owner=your-github-org \
  --branch-pattern="main" \
  --build-config=deploy/nextjs/cloudbuild-deploy.yaml \
  --description="NextJS deploy trigger"
```

### 3. Update Configuration Files

Update the following files with your project-specific values:

- **build.sh**: Update `TRIGGER_ID` with your actual trigger ID
- **deploy.sh**: Update `DEPLOY_TRIGGER_ID` with your actual deploy trigger ID
- **cloudrun.skaffold.yaml**: Update `projectid` with your GCP project ID
- **cloudrun.clouddeploy.yaml**: Update project references

## Deployment Methods

### 1. Automated Deployment (Recommended)

Once Cloud Build triggers are configured, deployments happen automatically:

- **On any branch push**: Builds and pushes Docker image
- **On main branch push**: Builds, pushes, and deploys to production

### 2. Manual Deployment

#### Using the build script:

```bash
cd deploy/nextjs
chmod +x build.sh deploy.sh

# Build images for both environments
./build.sh
```

#### Using the deploy script:

```bash
# Deploy to development
./deploy.sh -t <commit-hash> -e dev

# Deploy to production
./deploy.sh -t <commit-hash> -e prod
```

#### Direct Docker build:

```bash
# Build locally
docker build -t nextjs:latest -f deploy/nextjs/Dockerfile .

# Tag for registry
docker tag nextjs:latest us-central1-docker.pkg.dev/your-project/containers/nextjs-dev:latest

# Push to registry
docker push us-central1-docker.pkg.dev/your-project/containers/nextjs-dev:latest
```

### 3. Local Development with Skaffold

```bash
cd deploy/nextjs
skaffold dev --port-forward
```

This will:

- Build the Docker image locally
- Deploy to your development environment
- Set up port forwarding to localhost:3000
- Watch for file changes and redeploy automatically

## Environment Variables

### Build-time Variables

These are injected during the Docker build process:

- `NODE_ENV`: Environment mode (development/production)
- `NEXTAUTH_URL`: NextAuth.js URL
- `NEXT_PUBLIC_APP_URL`: Public app URL

### Runtime Variables

These are available at runtime in Cloud Run:

- `DATABASE_URL`: Database connection string (from Secret Manager)
- `NEXTAUTH_SECRET`: NextAuth.js secret (from Secret Manager)

### Adding New Environment Variables

1. **For build-time variables**: Add to Dockerfile ARG/ENV sections
2. **For runtime variables**: Add to Cloud Build configs and Cloud Run manifests
3. **For secrets**: Create in Secret Manager and reference in configs

## Resource Configuration

### Development Environment

- **CPU**: 1 vCPU
- **Memory**: 2 GB
- **Scaling**: 0-10 instances
- **Authentication**: Public (unauthenticated)

### Production Environment

- **CPU**: 2 vCPU
- **Memory**: 4 GB
- **Scaling**: 1-20 instances
- **Authentication**: Public (unauthenticated)

## Monitoring and Debugging

### View Logs

```bash
# Cloud Run logs
gcloud logs read --limit=50 --filter="resource.type=cloud_run_revision"

# Cloud Build logs
gcloud builds list --limit=10
gcloud builds log <build-id>
```

### Access Services

```bash
# Get service URLs
gcloud run services list --platform=managed --region=us-central1

# Describe a service
gcloud run services describe nextjs-dev --platform=managed --region=us-central1
```

### Debug Failed Deployments

1. Check Cloud Build logs for build failures
2. Check Cloud Run logs for runtime errors
3. Verify secret access permissions
4. Check environment variable configuration

## Security Best Practices

1. **Use Secret Manager** for all sensitive data
2. **Enable Binary Authorization** for container image verification
3. **Set appropriate IAM permissions** for Cloud Build service account
4. **Use VPC connectors** if accessing private resources
5. **Enable audit logging** for compliance

## Cost Optimization

1. **Configure appropriate scaling** (min/max instances)
2. **Use smaller container images** (multi-stage builds help)
3. **Set resource limits** based on actual usage
4. **Monitor billing** and set up alerts

## Troubleshooting

### Common Issues

1. **Build failures**: Check Dockerfile syntax and dependencies
2. **Permission errors**: Verify Cloud Build service account permissions
3. **Secret access errors**: Check Secret Manager IAM bindings
4. **Image pull errors**: Verify registry permissions and image names
5. **Service startup failures**: Check application logs and health checks

### Useful Commands

```bash
# Test Docker build locally
docker build -t test-nextjs -f deploy/nextjs/Dockerfile .

# Run container locally
docker run -p 3000:3000 test-nextjs

# Check Cloud Run service status
gcloud run services describe nextjs-dev --region=us-central1

# Update Cloud Run service
gcloud run services update nextjs-dev --region=us-central1 --image=new-image

# View Cloud Build history
gcloud builds list --filter="tags='your-tag'"
```
