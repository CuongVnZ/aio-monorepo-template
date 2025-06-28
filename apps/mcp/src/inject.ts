// import { getChatService as getAgentChatService } from "./services/chat/chat-service";
// import spruce from "@api/spruce";
import { Redis } from "ioredis";
import pkg from "twilio";

import { db as drizzleDb } from "@acme/db/client";

const { Twilio } = pkg;

export type ProtectedServices = ReturnType<typeof injectProtectedServices>;
export type PublicServices = ReturnType<typeof injectPublicServices>;
export type Services = ProtectedServices & PublicServices;

export async function injectPublicServices() {
  const simpleService = {
    ping: () => "pong",
  };

  return {
    simpleService,
  };
}

export async function injectProtectedServices(
  db: typeof drizzleDb,
  admin?: boolean,
) {
  const redis = new Redis(process.env.REDIS_URL!);
  const publicServices = await injectPublicServices();

  return {
    ...publicServices,

    db,
    redis,
  };
}

const globalForServices = globalThis as unknown as {
  services: ProtectedServices | undefined;
};

export const getGlobalServices = () => {
  const services =
    globalForServices.services ?? injectProtectedServices(drizzleDb);
  // To prevent recreation
  globalForServices.services = services;
  return services;
};
