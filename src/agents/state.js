import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  input: Annotation(),
  plan: Annotation(),
  currentStep: Annotation(),
  // Use a reducer to ensure completedSteps always accumulates
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
  selectedResources: Annotation({
    reducer: (x, y) => Array.from(new Set([...x, ...y])),
    default: () => ["core.resource", "ax.resource"],
  }),
  activeToolId: Annotation(),
  // Field to track all files extracted in the current session
  extractedFiles: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  // Optimization fields
  axTree: Annotation(),
  refMap: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  snapshot: Annotation(),
});
