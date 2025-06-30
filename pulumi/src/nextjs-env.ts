import { EnvVars } from "./config";

export const nextjsEnvVars: EnvVars = {
  // Regular environment variables with explicitly defined dev/prod values
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
    NEXT_PUBLIC_APP_URL: {
      dev: "https://nextjs-dev-your-project.us-central1.run.app",
      prod: "https://your-domain.com",
      includeInBuild: true,
    },
  },
  // Secret environment variables with their secret manager secret names for dev/prod
  secrets: {
    DATABASE_URL: {
      dev: "DATABASE_URL_DEV",
      prod: "DATABASE_URL_PROD",
    },
    NEXTAUTH_SECRET: {
      dev: "NEXTAUTH_SECRET_DEV",
      prod: "NEXTAUTH_SECRET_PROD",
    },
    // Add other secrets as needed for your NextJS app
    // Example: API keys, third-party service credentials, etc.
  },
};
