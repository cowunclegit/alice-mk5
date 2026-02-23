import { StateGraph, END, START } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { planner } from "./nodes/planner.js";
import { verifier } from "./nodes/verifier.js";
import { saver } from "./nodes/saver.js";
import { captureDom } from "./nodes/capture_dom.js";
import { analyzer } from "./nodes/analyzer.js";
import { validator } from "./nodes/validator.js";

const AgentState = Annotation.Root({
  intent: Annotation(),
  domain: Annotation(),
  sessionId: Annotation(),
  axTree: Annotation(),
  candidates: Annotation(),
  draftKeyword: Annotation(),
  aliases: Annotation(),
  retryCount: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0
  }),
  history: Annotation({
    reducer: (x, y) => [...(x || []), ...y],
    default: () => []
  }),
  status: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'idle'
  }),
  dataStore: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({})
  })
});

const shouldContinue = (state) => {
  if (state.status === 'error') return END;
  if (state.status === 'idle' && state.draftKeyword) return END; // Finished
  if (state.status === 'analyzing') return "planner";
  if (state.status === 'verifying') return "verifier";
  if (state.status === 'saving') return "saver";
  return END;
};

const workflow = new StateGraph(AgentState)
  .addNode("capture_dom", captureDom)
  .addNode("analyzer", analyzer)
  .addNode("planner", planner)
  .addNode("verifier", verifier)
  .addNode("validator", validator)
  .addNode("saver", saver)
  
  .addEdge(START, "capture_dom")
  .addEdge("capture_dom", "analyzer")
  .addEdge("analyzer", "planner")
  
  .addConditionalEdges("planner", (state) => {
    if (state.draftKeyword?.action === 'delete') return "validator";
    return "verifier";
  })
  
  .addConditionalEdges("verifier", (state) => {
    if (state.status === 'saving') return "validator";
    if (state.status === 'analyzing') return "capture_dom";
    return END;
  })
  
  .addEdge("validator", "saver")
  .addEdge("saver", END);

export const graph = workflow.compile();
