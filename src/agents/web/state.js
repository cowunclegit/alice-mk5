import { Annotation } from "@langchain/langgraph";

const reduceCompletedSteps = (current, update) => current.concat(update);

export const AgentState = Annotation.Root({
  input: Annotation(),
  intent: Annotation(),
  taskId: Annotation(),
  sessionId: Annotation(),
  dataStore: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  remainingSteps: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  completedSteps: Annotation({
    reducer: reduceCompletedSteps,
    default: () => [],
  }),
  currentStep: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  currentHTML: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  retryCount: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  selectedResources: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  status: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'idle',
  }),
  isSubAgent: Annotation(),
  originalInput: Annotation(),
  context: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});
