import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import {
  branchName,
  envTag,
  generateBuildAvailableSecrets,
  generateBuildEnvVars,
  generateDeployEnvVars,
  location,
  project,
  projectId,
} from "../config";
import { nextjsEnvVars } from "../nextjs-env";

export const nextjsImageName = pulumi.interpolate`${location}-docker.pkg.dev/${projectId}/containers/nextjs-${envTag}`;
export const nextjsServiceName = `nextjs-${envTag}`;
export const nextjsTriggerName = `nextjs-trigger-${envTag}`;
export const nextjsPRTriggerName = `nextjs-pr-trigger-${envTag}`;

export const buildNextjsTrigger = () => {
  const nextjsPRTrigger = new gcp.cloudbuild.Trigger(nextjsPRTriggerName, {
    name: nextjsPRTriggerName,
    project: project,
    location: location,
    description: "PR validation trigger for NextJS application",
    github: {
      owner: "your-github-org",
      name: "worker-template",
      pullRequest: {
        branch: `^${branchName}$`,
      },
    },
    includeBuildLogs: "INCLUDE_BUILD_LOGS_WITH_STATUS",
    includedFiles: [
      "apps/nextjs/**",
      "packages/**",
      "pulumi/src/services/nextjs.ts",
      "pulumi/src/nextjs-env.ts",
    ],
    build: {
      timeout: "1800s",
      steps: [
        {
          name: "gcr.io/cloud-builders/docker",
          id: "docker-build",
          entrypoint: "bash",
          args: [
            "-c",
            pulumi.interpolate`
            docker build \
            -t ${nextjsImageName}:$SHORT_SHA \
            -f apps/nextjs/Dockerfile \
            ${generateBuildEnvVars(nextjsEnvVars)} \
            .`,
          ],
          secretEnvs: generateBuildAvailableSecrets(nextjsEnvVars).map(
            ({ env }) => env,
          ),
        },
        {
          name: "gcr.io/cloud-builders/docker",
          id: "docker-push",
          args: ["push", pulumi.interpolate`${nextjsImageName}:$SHORT_SHA`],
        },
      ],
      options: {
        dynamicSubstitutions: true,
        requestedVerifyOption: "VERIFIED",
      },
      availableSecrets: {
        secretManagers: generateBuildAvailableSecrets(nextjsEnvVars),
      },
    },
  });

  const nextjsTrigger = new gcp.cloudbuild.Trigger(nextjsTriggerName, {
    name: nextjsTriggerName,
    project: project,
    location: location,
    description: "Build and deploy trigger for NextJS application",
    github: {
      owner: "your-github-org",
      name: "worker-template",
      push: {
        branch: `^${branchName}$`,
      },
    },
    includeBuildLogs: "INCLUDE_BUILD_LOGS_WITH_STATUS",
    includedFiles: [
      "apps/nextjs/**",
      "packages/**",
      "pulumi/src/services/nextjs.ts",
      "pulumi/src/nextjs-env.ts",
    ],
    build: {
      timeout: "1800s",
      steps: [
        {
          name: "gcr.io/cloud-builders/docker",
          id: "docker-build",
          entrypoint: "bash",
          args: [
            "-c",
            pulumi.interpolate`
            docker build \
            -t ${nextjsImageName}:$SHORT_SHA \
            -f apps/nextjs/Dockerfile \
            ${generateBuildEnvVars(nextjsEnvVars)} \
            .`,
          ],
          secretEnvs: generateBuildAvailableSecrets(nextjsEnvVars).map(
            ({ env }) => env,
          ),
        },
        {
          name: "gcr.io/cloud-builders/docker",
          id: "docker-push",
          args: ["push", pulumi.interpolate`${nextjsImageName}:$SHORT_SHA`],
        },
        {
          name: "gcr.io/cloud-builders/gcloud",
          id: "deploy-to-cloud-run",
          entrypoint: "bash",
          args: [
            "-c",
            pulumi.interpolate`
            gcloud run deploy \
            ${nextjsServiceName} \
            --image ${nextjsImageName}:$SHORT_SHA \
            --region ${location} \
            --platform managed \
            --allow-unauthenticated \
            ${generateDeployEnvVars(nextjsEnvVars)}
            `,
          ],
        },
      ],
      images: [pulumi.interpolate`${nextjsImageName}:$SHORT_SHA`],
      options: {
        dynamicSubstitutions: true,
        requestedVerifyOption: "VERIFIED",
      },
      availableSecrets: {
        secretManagers: generateBuildAvailableSecrets(nextjsEnvVars),
      },
    },
  });

  return {
    nextjsTrigger,
    nextjsPRTrigger,
  };
};
