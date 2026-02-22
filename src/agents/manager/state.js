import { Annotation } from "@langchain/langgraph";

const reduceDataStore = (current, update) => {
  return { ...current, ...update };
};

const reduceRetryCounts = (current, update) => {
  return { ...current, ...update };
};

const reduceLineage = (current, update) => {
  return { ...current, ...update };
};

export const ManagerState = Annotation.Root({
  input: Annotation(),
  tasks: Annotation(),
  currentTaskIndex: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  dataStore: Annotation({
    reducer: reduceDataStore,
    default: () => ({}),
  }),
  retryCounts: Annotation({
    reducer: reduceRetryCounts,
    default: () => ({}),
  }),
  status: Annotation(),
  reasoning: Annotation(),
  sessionId: Annotation(),
  history: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  lineage: Annotation({
    reducer: reduceLineage,
    default: () => ({}),
  }),
  clean_history: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  toolId: Annotation(),
  platform: Annotation(),
  variables: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  manifest: Annotation(),
  resource_proposal: Annotation(),
});
