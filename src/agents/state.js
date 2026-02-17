import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  input: Annotation(),
  plan: Annotation(),
  currentStep: Annotation(),
  completedSteps: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  remainingSteps: Annotation(),
  currentHTML: Annotation(),
  candidates: Annotation(),
  context: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  retryCount: Annotation(),
  status: Annotation(),
  reasoning: Annotation(),
  sessionId: Annotation(),
});
