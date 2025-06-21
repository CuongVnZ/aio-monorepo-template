import { proxyActivities } from "@temporalio/workflow";
import { SampleActivity } from "../activities/sample";

export interface SampleWorkflowActivities {
  sampleActivity: SampleActivity;
}

const activities = proxyActivities<SampleWorkflowActivities>({
  startToCloseTimeout: "10 minutes",
});

// Workflow that just returns the message
export async function SampleWorkflow(input: { message: string }): Promise<{
  message: string;
}> {
  const message = await activities.sampleActivity({
    message: input.message,
  });
  return {
    message: message.message,
  };
}
