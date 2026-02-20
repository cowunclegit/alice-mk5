import { Annotation } from "@langchain/langgraph";

export const AppState = Annotation.Root({
  intent: Annotation(),
  originalInput: Annotation(),
  plan: Annotation(),
  currentStep: Annotation(),
  completedSteps: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  remainingSteps: Annotation(),
  currentXML: Annotation(),
  candidates: Annotation(),
  context: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  retryCount: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  status: Annotation(),
  reasoning: Annotation(),
  sessionId: Annotation(),
  selectedResources: Annotation({
    reducer: (x, y) => Array.from(new Set([...x, ...y])),
    default: () => ["application/core.resource"],
  }),
  isSubAgent: Annotation(),
  dataStore: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  appCapabilities: Annotation(),
});
