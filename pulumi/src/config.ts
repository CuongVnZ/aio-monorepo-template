import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import { getCommitHash, getPackageVersion } from "./utils";

export const config = new pulumi.Config();

export const gcpConfig = new pulumi.Config("gcp");
export const location = gcpConfig.require("region");
export const project = gcpConfig.require("project");
export const zone = gcpConfig.require("zone");
export const branchName = config.require("branchName");
export const projectId = pulumi.output(gcp.config.project);
export const envTag = branchName === "main" ? "prod" : "dev";
export const region = pulumi.output(gcp.config.region);

export const getTag = () => {
  const version = getPackageVersion();
  const commitHash = getCommitHash();
  return `${envTag}-${version}-${commitHash}`;
};

export interface EnvVarConfig {
  dev: string;
  prod: string;
  includeInBuild?: boolean;
}

export interface EnvVars {
  literals: Record<string, EnvVarConfig>;
  secrets: Record<string, EnvVarConfig>;
}

// Helper function to generate secret substitutions for the build args
export const generateBuildAvailableSecrets = (envs: EnvVars) => {
  return Object.entries(envs.secrets)
    .filter(([_, config]) => config.includeInBuild)
    .map(([name, { dev, prod }]) => ({
      versionName: pulumi.interpolate`projects/${projectId}/secrets/${envTag === "prod" ? prod : dev}/versions/latest`,
      env: name,
    }));
};

export const generateBuildEnvVars = (envs: EnvVars) => {
  const buildArgs: string[] = [];

  // Add regular env vars
  Object.entries(envs.literals)
    .filter(([_, config]) => config.includeInBuild)
    .forEach(([name, config]) => {
      const value = config[envTag === "prod" ? "prod" : "dev"];
      buildArgs.push(`--build-arg`, `${name}=${value}`);
    });

  // Add secret env vars
  Object.entries(envs.secrets)
    .filter(([_, config]) => config.includeInBuild)
    .forEach(([name]) => {
      buildArgs.push(`--build-arg`, `${name}=$$${name}`);
    });

  return buildArgs.join(" ");
};

// Helper function to generate deploy env vars
export const generateDeployEnvVars = (envs: EnvVars) => {
  const envFlags: string[] = [];

  // Add regular env vars
  Object.entries(envs.literals).forEach(([name, config]) => {
    const value = config[envTag === "prod" ? "prod" : "dev"];
    envFlags.push(`--set-env-vars ${name}=${value}`);
  });

  // Add secret env vars
  Object.entries(envs.secrets).forEach(([name, { dev, prod }]) => {
    const secretName = envTag === "prod" ? prod : dev;
    envFlags.push(`--set-secrets ${name}=${secretName}:latest`);
  });

  return envFlags.join(" ");
};

export const generateCloudFunctionEnvVars = (envs: EnvVars) => {
  const envFlags: string[] = [];

  // Add regular env vars
  Object.entries(envs.literals).forEach(([name, config]) => {
    const value = config[envTag === "prod" ? "prod" : "dev"];
    envFlags.push(`--set-env-vars="${name}=${value}"`);
  });

  // Add secret env vars
  Object.entries(envs.secrets).forEach(([name, { dev, prod }]) => {
    const secretName = envTag === "prod" ? prod : dev;
    envFlags.push(`--set-secrets="${name}=${secretName}:latest"`);
  });

  return envFlags.join(" ");
};
