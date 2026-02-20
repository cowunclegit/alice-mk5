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
    return "finalizer";
  });

  workflow.addConditionalEdges("executor", (state) => {
    // If a task failed, try auto-fix
    if (state.status === 'error') return "auto_fix";
    
    // If more tasks remain, keep executing
    if (state.currentTaskIndex < state.tasks.length) return "executor";
    
    // All tasks done (or skipped) -> Summarize
    return "summarizer";
  });

  workflow.addConditionalEdges("auto_fix", (state) => {
    // If auto-fix decided to try again
    if (state.status === 'executing') return "executor";
    // If auto-fix gave up -> go to summary to show what we have
    return "summarizer";
  });

  workflow.addEdge("summarizer", "finalizer");
  workflow.addEdge("finalizer", END);

  return workflow.compile();
};
