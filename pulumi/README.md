# Pulumi Infrastructure for NextJS Deployment

This directory contains Pulumi configuration for deploying the NextJS application to Google Cloud Platform using Cloud Run.

## Overview

This Pulumi setup provides:

- **Automated CI/CD**: Cloud Build triggers for both PR validation and deployment
- **Multi-environment support**: Separate configurations for development and production
- **Environment variable management**: Support for both regular environment variables and secrets stored in Google Secret Manager
- **Docker-based deployment**: Containerized deployment to Google Cloud Run

## Prerequisites

1. **Google Cloud Project**: Set up a GCP project with billing enabled
2. **Required APIs**: Enable the following Google Cloud APIs:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API
   - Secret Manager API
3. **Authentication**: Set up authentication using one of:
   - `gcloud auth login` for local development
   - Service account key for CI/CD
4. **Pulumi CLI**: Install the [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
5. **Docker Repository**: Set up Google Container Registry or Artifact Registry

## Configuration

### 1. Environment Variables

Update the environment configurations in `src/nextjs-env.ts`:

```typescript
export const nextjsEnvVars: EnvVars = {
  literals: {
    NODE_ENV: {
      dev: "development",
      prod: "production",
      includeInBuild: true,
    },
    NEXTAUTH_URL: {
      dev: "https://nextjs-dev-your-project.us-central1.run.app",
      prod: "https://your-domain.com",
      includeInBuild: true,
    },
    // Add more environment variables as needed
  },
  secrets: {
    DATABASE_URL: {
      dev: "DATABASE_URL_DEV",
      prod: "DATABASE_URL_PROD",
    },
    // Add more secrets as needed
  },
};
```

### 2. Project Configuration

Update the Pulumi stack configurations:

**Development (`Pulumi.dev.yaml`):**

```yaml
config:
  gcp:project: your-project-dev
  gcp:region: us-central1
  gcp:zone: us-central1-a
  branchName: dev
```

**Production (`Pulumi.prod.yaml`):**

```yaml
config:
  gcp:project: your-project-prod
  gcp:region: us-central1
  gcp:zone: us-central1-a
  branchName: main
```

### 3. GitHub Configuration

Update the GitHub repository settings in `src/services/nextjs.ts`:

```typescript
github: {
  owner: "your-github-org",
  name: "worker-template",
  // ... rest of the configuration
}
```

## Secret Management

### Creating Secrets in Google Secret Manager

For each secret defined in `nextjs-env.ts`, create corresponding secrets in Google Secret Manager:

```bash
# Example: Creating a database URL secret for development
echo "postgresql://user:password@host:port/database" | gcloud secrets create DATABASE_URL_DEV --data-file=-

# Example: Creating a database URL secret for production
echo "postgresql://user:password@host:port/database" | gcloud secrets create DATABASE_URL_PROD --data-file=-
```

### Required Secrets

Based on the default configuration, you'll need to create these secrets:

- `DATABASE_URL_DEV` and `DATABASE_URL_PROD`
- `NEXTAUTH_SECRET_DEV` and `NEXTAUTH_SECRET_PROD`

## Deployment

### Initial Setup

1. **Install dependencies**:

   ```bash
   cd pulumi
   pnpm install
   ```

2. **Initialize Pulumi stack**:

   ```bash
   # For development
   pulumi stack init dev
   pulumi config set-all --path=./Pulumi.dev.yaml

   # For production
   pulumi stack init prod
   pulumi config set-all --path=./Pulumi.prod.yaml
   ```

3. **Deploy infrastructure**:

   ```bash
   # Deploy to development
   pulumi stack select dev
   pulumi up

   # Deploy to production
   pulumi stack select prod
   pulumi up
   ```

### Automated Deployment

Once the infrastructure is deployed, the Cloud Build triggers will automatically:

1. **On Pull Requests**: Build and validate the Docker image
2. **On Main Branch Push**: Build, push, and deploy the application to Cloud Run

### Manual Deployment

You can also deploy manually using the provided script:

```bash
# Build and push image manually
./deploy-image.sh nextjs dev abc123

# Where:
# - nextjs: service name
# - dev: environment (dev/prod)
# - abc123: git commit hash or tag
```

## Project Structure

```
pulumi/
├── src/
│   ├── config.ts           # Shared configuration and helpers
│   ├── index.ts            # Main entry point
│   ├── nextjs-env.ts       # Environment variables for NextJS
│   ├── utils.ts            # Utility functions
│   └── services/
│       └── nextjs.ts       # NextJS service configuration
├── deploy-image.sh         # Manual deployment script
├── package.json
├── Pulumi.yaml            # Main Pulumi configuration
├── Pulumi.dev.yaml        # Development environment config
├── Pulumi.prod.yaml       # Production environment config
└── README.md
```

## Environment Variables

### Build-time Variables

Variables with `includeInBuild: true` are injected during the Docker build process and become part of the image.

### Runtime Variables

All variables (both literals and secrets) are available at runtime in the Cloud Run environment.

## Monitoring and Logs

- **Cloud Build Logs**: Available in the Google Cloud Console under Cloud Build > History
- **Cloud Run Logs**: Available in the Google Cloud Console under Cloud Run > Service > Logs
- **Application Monitoring**: Set up monitoring and alerting as needed

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the Cloud Build service account has necessary permissions
2. **Secret Access**: Verify that secrets exist in Secret Manager and are properly named
3. **Build Failures**: Check Cloud Build logs for detailed error messages
4. **Deployment Issues**: Verify Cloud Run service configuration and resource limits

### Useful Commands

```bash
# Check Pulumi state
pulumi stack output

# View Cloud Build triggers
gcloud builds triggers list

# View Cloud Run services
gcloud run services list

# View logs
gcloud logs read --limit=50
```

## Customization

### Adding New Environment Variables

1. Add the variable to `src/nextjs-env.ts`
2. For secrets, create the secret in Google Secret Manager
3. Update the Dockerfile if the variable is needed at build time
4. Redeploy the infrastructure: `pulumi up`

### Adding New Services

1. Create a new service file in `src/services/`
2. Add environment configuration file
3. Import and call the service function in `src/index.ts`
4. Update included files in the Cloud Build trigger configuration

## Security Considerations

- **Secrets Management**: Always use Google Secret Manager for sensitive data
- **IAM Permissions**: Follow the principle of least privilege
- **Network Security**: Configure VPC and firewall rules as needed
- **Container Security**: Keep base images updated and scan for vulnerabilities

## Cost Optimization

- **Resource Limits**: Configure appropriate CPU and memory limits for Cloud Run
- **Scaling**: Set minimum and maximum instance counts based on usage patterns
- **Region Selection**: Choose regions close to your users to reduce latency and costs
