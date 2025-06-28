/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import IORedis from "ioredis";

import { env } from "../env";

declare global {
  // eslint-disable-next-line no-var
  var redis: IORedis;
}

if (!global.redis) {
  global.redis = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
  });
}

export const createConnection = () => {
  if (global.redis) {
    return global.redis;
  }
  
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  });
};

export const closeConnection = async (connection: IORedis): Promise<void> => {
  await connection.quit();
};
