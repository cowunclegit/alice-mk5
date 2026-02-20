import { StateGraph, END, START } from "@langchain/langgraph";
import { ManagerState } from "./state.js";
import { decomposer } from "./nodes/decomposer.js";
import { approver } from "./nodes/approver.js";
import { executor } from "./nodes/executor.js";
import { autoFix } from "./nodes/auto_fix.js";
import { summarizer } from "./nodes/summarizer.js";
import { finalizer } from "./nodes/finalizer.js";

export const managerGraph = () => {
  const workflow = new StateGraph(ManagerState)
    .addNode("decomposer", decomposer)
    .addNode("approver", approver)
    .addNode("executor", executor)
    .addNode("auto_fix", autoFix)
    .addNode("summarizer", summarizer)
    .addNode("finalizer", finalizer);

  workflow.addEdge(START, "decomposer");
  workflow.addEdge("decomposer", "approver");
  
  workflow.addConditionalEdges("approver", (state) => {
    if (state.status === 'executing') return "executor";
    return END;
  });

  workflow.addConditionalEdges("executor", (state) => {
    if (state.status === 'error') return "auto_fix";
    
    // If successful and more tasks remain, go to next task via executor
    if (state.currentTaskIndex < state.tasks.length) return "executor";
    
    // All tasks completed
    return "summarizer";
  });

  workflow.addConditionalEdges("auto_fix", (state) => {
    if (state.status === 'executing') return "executor";
    return "summarizer";
  });

  workflow.addEdge("summarizer", "finalizer");
  workflow.addEdge("finalizer", END);

  return workflow.compile();
};
