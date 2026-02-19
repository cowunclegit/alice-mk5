import { StateGraph, END, START } from "@langchain/langgraph";
import { AppState } from "./state.js";
// nodes will be imported later

export const appSubGraph = (nodes) => {
  const workflow = new StateGraph(AppState)
    .addNode("discovery", nodes.discovery)
    .addNode("planner", nodes.planner)
    .addNode("capture_xml", nodes.capture_xml)
    .addNode("analyzer", nodes.analyzer)
    .addNode("executor", nodes.executor)
    .addNode("validator", nodes.validator)
    .addNode("reviser", nodes.reviser)
    .addNode("finalizer", nodes.finalizer);

  workflow.addEdge(START, "discovery");
  workflow.addConditionalEdges("discovery", (state) => {
    if (state.status === 'error') return END;
    return "planner";
  });
  workflow.addEdge("planner", "capture_xml");
  workflow.addEdge("capture_xml", "analyzer");
  workflow.addEdge("analyzer", "executor");
  
  workflow.addConditionalEdges("executor", (state) => {
    if (state.status === 'error') return END;
    return "validator";
  });

  workflow.addConditionalEdges("validator", (state) => {
    if (state.status === 'fail' && state.retryCount < 5) return "reviser";
    if (state.remainingSteps?.length > 0) return "capture_xml";
    return "finalizer";
  });

  workflow.addEdge("reviser", "capture_xml");
  workflow.addEdge("finalizer", END);

  return workflow.compile();
};
