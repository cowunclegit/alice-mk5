import { Annotation } from "@langchain/langgraph";

export const ManagerState = Annotation.Root({
  input: Annotation(),
  tasks: Annotation(),
  currentTaskIndex: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  dataStore: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  status: Annotation(),
  reasoning: Annotation(),
  sessionId: Annotation(),
  selectedResources: Annotation({
    reducer: (x, y) => Array.from(new Set([...x, ...y])),
    default: () => ["core.resource"],
  }),
  history: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});
