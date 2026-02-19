import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { planner } from "./nodes/planner.js";
import { executor } from "./nodes/executor.js";
import { validator } from "./nodes/validator.js";
import { finalizer } from "./nodes/finalizer.js";
import { reviser } from "./nodes/reviser.js";
import { router } from "./nodes/router.js";
import { toolLoader } from "./nodes/tool_loader.js";
import { simpleExecutor } from "./nodes/simple_executor.js";
import { resourceSelector } from "./nodes/resource_selector.js";
import { resultCollector } from "./nodes/result_collector.js";
import { analyzeNode } from "./nodes/analyze.js";
import { snapshotNode } from "./nodes/snapshot.js";

const shouldContinue = (state) => {
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  
  if (lastStep && lastStep.status === 'fail') {
    if (state.retryCount < 5) return "reviser";
    return "finalizer";
  }

  // If validator marked the intent as not met, we need more steps
  if (state.context.intentMet === false) {
    return "analyze_node"; // Loop back to start a new turn
  }

  if (state.remainingSteps && state.remainingSteps.length > 0) {
    return "initialize_step";
  }

  return "finalizer";
};

const initializeStep = (state) => {
  if (!state.remainingSteps || state.remainingSteps.length === 0) {
    return { currentStep: null, status: 'finished' };
  }
  const nextStep = state.remainingSteps[0];
  const remaining = state.remainingSteps.slice(1);
  return {
    currentStep: nextStep,
    remainingSteps: remaining,
    status: 'executing'
  };
};

/**
 * Decides whether to go to Planner (initial/retry) or Validator (after action).
 */
const afterAnalysis = (state) => {
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  // If we just executed something and haven't validated it yet
  if (lastStep && state.context.lastValidatedStepIndex !== state.completedSteps.length - 1) {
    return "validator";
  }
  return "snapshot_node";
};

const workflow = new StateGraph(AgentState)
  // Nodes
  .addNode("resource_selector", resourceSelector)
  .addNode("analyze_node", analyzeNode)
  .addNode("snapshot_node", snapshotNode)
  .addNode("planner", planner)
  .addNode("tool_loader", toolLoader)
  .addNode("initialize_step", initializeStep)
  .addNode("executor", executor)
  .addNode("simple_executor", simpleExecutor)
  .addNode("result_collector", resultCollector)
  .addNode("validator", validator)
  .addNode("finalizer", finalizer)
  .addNode("reviser", reviser)
  
  // Routing
  .addConditionalEdges(START, router, {
    "tool_execution": "tool_loader",
    "tool_making": "resource_selector"
  })

  // Path A: Tool Execution
  .addEdge("tool_loader", "simple_executor")
  .addEdge("simple_executor", END)

  // Path B: Tool Making (Optimized)
  .addEdge("resource_selector", "analyze_node")
  .addConditionalEdges("analyze_node", afterAnalysis)
  .addEdge("snapshot_node", "planner")
  .addEdge("planner", "initialize_step")
  .addEdge("initialize_step", "executor")
  .addEdge("executor", "analyze_node") // Re-analyze after every action
  .addConditionalEdges("validator", shouldContinue)
  .addEdge("reviser", "analyze_node")
  .addEdge("finalizer", END);

export const graph = workflow.compile();
