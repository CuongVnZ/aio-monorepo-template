import { MetricsTime } from "bullmq";

export const metricsConfig = {
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2,
  },
};
