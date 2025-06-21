export * from "./sample";
export * from "./slack-agent";

import { type SampleWorkflowActivities } from "./sample";
import { type SlackAgentWorkflowActivities } from "./slack-agent";

export type Activities = SampleWorkflowActivities &
  SlackAgentWorkflowActivities;
