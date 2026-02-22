import { Annotation } from "@langchain/langgraph";

const reduceDataStore = (current, update) => ({ ...current, ...update });
const reduceHistory = (current, update) => current.concat(update);

export const ManagerState = Annotation.Root({
  input: Annotation(),
  tasks: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  currentTaskIndex: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  dataStore: Annotation({
    reducer: reduceDataStore,
    default: () => ({}),
  }),
  history: Annotation({
    reducer: reduceHistory,
    default: () => [],
  }),
  replanCount: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  status: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'idle',
  }),
  reasoning: Annotation(),
  sessionId: Annotation(),
  lineage: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});
