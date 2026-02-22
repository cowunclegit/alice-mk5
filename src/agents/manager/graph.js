import { StateGraph, END, START } from "@langchain/langgraph";
import { ManagerState } from "./state.js";
import { decomposer } from "./nodes/decomposer.js";
import { executor } from "./nodes/executor.js";
import { summarizer } from "./nodes/summarizer.js";
import { approver } from "./nodes/approver.js";
import { finalizer } from "./nodes/finalizer.js";

export const managerGraph = () => {
  const workflow = new StateGraph(ManagerState)
    .addNode("decomposer", decomposer)
    .addNode("approver", approver)
    .addNode("executor", executor)
    .addNode("summarizer", summarizer)
    .addNode("finalizer", finalizer);

  // Flow Definition
  workflow.addEdge(START, "decomposer");
  
  // After planning, check if direct answer or approval needed
  workflow.addConditionalEdges("decomposer", (state) => {
    if (state.status === 'finished') return "finalizer"; // LLM-direct answer
    return "approver";
  });

  workflow.addConditionalEdges("approver", (state) => {
    if (state.status === 'executing') return "executor";
    return END; // User rejected plan
  });

  workflow.addConditionalEdges("executor", (state) => {
    if (state.status === 'replanning') return "decomposer"; // Failover loop
    if (state.status === 'executing') {
      // Check if more tasks exist
      if (state.currentTaskIndex < state.tasks.length) return "executor";
      return "summarizer";
    }
    return "finalizer"; // Fatal error
  });

  workflow.addConditionalEdges("summarizer", (state) => {
    if (state.status === 'replanning') return "decomposer"; // Late failover
    return "finalizer";
  });

  workflow.addEdge("finalizer", END);

  return workflow.compile();
};
