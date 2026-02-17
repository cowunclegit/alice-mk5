import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  input: Annotation(),
  plan: Annotation(),
  currentStep: Annotation(),
  completedSteps: Annotation(),
  remainingSteps: Annotation(),
  currentHTML: Annotation(),
  candidates: Annotation(),
  context: Annotation(),
  retryCount: Annotation(),
  status: Annotation(),
  reasoning: Annotation(),
});
