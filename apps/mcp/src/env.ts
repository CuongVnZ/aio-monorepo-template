import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    ELSA_ENV: z.enum(["local", "dev", "prod"]).default("local"),

    // Clerk
    CLERK_SECRET_KEY: z.string(),

    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),

    GCS_BUCKET_NAME: z.string(),

    PINECONE_INDEX_NAME: z.string(),
    PINECONE_API_KEY: z.string(),

    OPENAI_API_KEY: z.string(),

    VERTEXAI_PROJECT: z.string(),
    VERTEXAI_LOCATION: z.string(),
    VERTEXAI_ANTHROPIC_LOCATION: z.string(),

    TEMPORAL_ADDRESS: z.string(),
    TEMPORAL_NAMESPACE: z.string(),
    TEMPORAL_TASK_QUEUE: z.string(),

    TEMPORAL_CLIENT_CERT: z.string().optional(),
    TEMPORAL_CLIENT_KEY: z.string().optional(),

    DISABLE_PRISMA_LOGGING: z.coerce.boolean().optional(),
    DISABLE_AUDIT_LOGGING: z.coerce.boolean().optional(),

    REDIS_URL: z.string(),

    DOCUMO_API_KEY: z.string(),
    DOCUMO_WEBHOOK_USERNAME: z.string(),
    DOCUMO_WEBHOOK_PASSWORD: z.string(),

    STREAM_API_KEY: z.string(),
    STREAM_API_SECRET: z.string(),

    STRIPE_SECRET_KEY: z.string(),

    LAB_ORDER_TEMPLATE_STORAGE_REFERENCE_ID: z.string(),
    ULTRASOUND_ORDER_TEMPLATE_STORAGE_REFERENCE_ID: z.string(),

    TWILIO_ACCOUNT_SID: z.string(),
    TWILIO_AUTH_TOKEN: z.string(),
    TWILIO_PHONE_NUMBER: z.string(),

    NODEMAILER_CLIENT_ID: z.string(),
    NODEMAILER_PRIVATE_KEY: z.string(),
    NODEMAILER_TOKEN_URI: z.string(),

    CARE_URL: z.string(),

    GA_MEASUREMENT_PROTOCOL_API_SECRET: z.string(),

    GOOGLE_MAPS_API_KEY: z.string(),

    ELSA_COORDINATORS_USER_ID: z.string(),

    CONSULTATION_STRIPE_PRODUCT_ID: z.string().optional(),
    EGG_FREEZING_STRIPE_PRODUCT_ID: z.string().optional(),
    EMBRYO_FREEZING_STRIPE_PRODUCT_ID: z.string().optional(),

    FERTILITY_101_CALENDLY_EVENT_TYPE_URI: z.string(),
    ELSA_CONSULTATION_CALENDLY_EVENT_TYPE_URI: z.string(),
    ASSESSMENT_FOLLOW_UP_CALENDLY_EVENT_TYPE_URI: z.string(),
    CALENDLY_API_KEY: z.string(),
    GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON_BASE64: z.string(),
    FERTILITY_SPECIALIST_CONSULTATION_GOOGLE_CALENDAR_ID: z.string(),

    AGENT_CHAT_MODEL_ID: z.string().optional(),

    SPRUCE_API_KEY: z.string(),
    SPRUCE_ENDPOINT_ID: z.string(),
    SPRUCE_WEBHOOK_SIGNING_SECRET: z.string(),
    SPRUCE_ELSA_ID_CUSTOM_FIELD_ID: z.string(),
    SPRUCE_ELSA_URL_CUSTOM_FIELD_ID: z.string(),
    SPRUCE_ELSA_PATIENT_CONTACT_TAG_ID: z.string(),

    ELSA_GOOGLE_CLOUD_PROJECT_ID: z.string(),
    N8N_API_SECRET: z.string(),
    PUBSUB_EVENTS_TOPIC_NAME: z.string(),

    PANDOC_SERVICE_URL: z.string(),
    SLACK_BOT_TOKEN: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_PLATFORM_URL: z.string(),
    NEXT_PUBLIC_ELSA_PROJECT_ID: z.string(),
    NEXT_PUBLIC_STREAM_API_KEY: z.string(),
    NEXT_PUBLIC_AMPLITUDE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_GA_ID: z.string().optional(),

    NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    PANDOC_SERVICE_URL: process.env.PANDOC_SERVICE_URL,

    ELSA_ENV: process.env.ELSA_ENV,
    AGENT_CHAT_MODEL_ID: process.env.AGENT_CHAT_MODEL_ID,

    FERTILITY_101_CALENDLY_EVENT_TYPE_URI:
      process.env.FERTILITY_101_CALENDLY_EVENT_TYPE_URI,
    ELSA_CONSULTATION_CALENDLY_EVENT_TYPE_URI:
      process.env.ELSA_CONSULTATION_CALENDLY_EVENT_TYPE_URI,
    ASSESSMENT_FOLLOW_UP_CALENDLY_EVENT_TYPE_URI:
      process.env.ASSESSMENT_FOLLOW_UP_CALENDLY_EVENT_TYPE_URI,
    FERTILITY_SPECIALIST_CONSULTATION_GOOGLE_CALENDAR_ID:
      process.env.FERTILITY_SPECIALIST_CONSULTATION_GOOGLE_CALENDAR_ID,
    GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON_BASE64:
      process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON_BASE64,
    CALENDLY_API_KEY: process.env.CALENDLY_API_KEY,

    CONSULTATION_STRIPE_PRODUCT_ID: process.env.CONSULTATION_STRIPE_PRODUCT_ID,
    EGG_FREEZING_STRIPE_PRODUCT_ID: process.env.EGG_FREEZING_STRIPE_PRODUCT_ID,
    EMBRYO_FREEZING_STRIPE_PRODUCT_ID:
      process.env.EMBRYO_FREEZING_STRIPE_PRODUCT_ID,

    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,

    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    GA_MEASUREMENT_PROTOCOL_API_SECRET:
      process.env.GA_MEASUREMENT_PROTOCOL_API_SECRET,

    CARE_URL: process.env.CARE_URL,

    NODEMAILER_CLIENT_ID: process.env.NODEMAILER_CLIENT_ID,
    NODEMAILER_PRIVATE_KEY: process.env.NODEMAILER_PRIVATE_KEY,
    NODEMAILER_TOKEN_URI: process.env.NODEMAILER_TOKEN_URI,

    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

    ELSA_COORDINATORS_USER_ID: process.env.ELSA_COORDINATORS_USER_ID,

    LAB_ORDER_TEMPLATE_STORAGE_REFERENCE_ID:
      process.env.LAB_ORDER_TEMPLATE_STORAGE_REFERENCE_ID,
    ULTRASOUND_ORDER_TEMPLATE_STORAGE_REFERENCE_ID:
      process.env.ULTRASOUND_ORDER_TEMPLATE_STORAGE_REFERENCE_ID,

    NEXT_PUBLIC_PLATFORM_URL: process.env.NEXT_PUBLIC_PLATFORM_URL,

    NEXT_PUBLIC_ELSA_PROJECT_ID: process.env.NEXT_PUBLIC_ELSA_PROJECT_ID,
    NEXT_PUBLIC_STREAM_API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY,

    STREAM_API_KEY: process.env.STREAM_API_KEY,
    STREAM_API_SECRET: process.env.STREAM_API_SECRET,

    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,

    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,

    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    VERTEXAI_PROJECT: process.env.VERTEXAI_PROJECT,
    VERTEXAI_LOCATION: process.env.VERTEXAI_LOCATION,
    VERTEXAI_ANTHROPIC_LOCATION: process.env.VERTEXAI_ANTHROPIC_LOCATION,

    REDIS_URL: process.env.REDIS_URL,

    DISABLE_PRISMA_LOGGING: process.env.DISABLE_PRISMA_LOGGING,
    DISABLE_AUDIT_LOGGING: process.env.DISABLE_AUDIT_LOGGING,

    TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS,
    TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE,
    TEMPORAL_TASK_QUEUE: process.env.TEMPORAL_TASK_QUEUE,

    TEMPORAL_CLIENT_CERT: process.env.TEMPORAL_CLIENT_CERT,
    TEMPORAL_CLIENT_KEY: process.env.TEMPORAL_CLIENT_KEY,

    //CALENDLY_ACCESS_TOKEN: process.env.CALENDLY_ACCESS_TOKEN,

    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,

    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,

    DOCUMO_API_KEY: process.env.DOCUMO_API_KEY,
    DOCUMO_WEBHOOK_USERNAME: process.env.DOCUMO_WEBHOOK_USERNAME,
    DOCUMO_WEBHOOK_PASSWORD: process.env.DOCUMO_WEBHOOK_PASSWORD,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    SPRUCE_API_KEY: process.env.SPRUCE_API_KEY,
    SPRUCE_ENDPOINT_ID: process.env.SPRUCE_ENDPOINT_ID,
    SPRUCE_WEBHOOK_SIGNING_SECRET: process.env.SPRUCE_WEBHOOK_SIGNING_SECRET,
    SPRUCE_ELSA_ID_CUSTOM_FIELD_ID: process.env.SPRUCE_ELSA_ID_CUSTOM_FIELD_ID,
    SPRUCE_ELSA_URL_CUSTOM_FIELD_ID:
      process.env.SPRUCE_ELSA_URL_CUSTOM_FIELD_ID,
    SPRUCE_ELSA_PATIENT_CONTACT_TAG_ID:
      process.env.SPRUCE_ELSA_PATIENT_CONTACT_TAG_ID,

    NEXT_PUBLIC_AMPLITUDE_API_KEY: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,

    ELSA_GOOGLE_CLOUD_PROJECT_ID: process.env.ELSA_GOOGLE_CLOUD_PROJECT_ID,
    N8N_API_SECRET: process.env.N8N_API_SECRET,
    PUBSUB_EVENTS_TOPIC_NAME: process.env.PUBSUB_EVENTS_TOPIC_NAME,

    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
