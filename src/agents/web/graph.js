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
import { captureDom } from "./nodes/capture_dom.js";

const shouldContinue = (state) => {
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  if (lastStep && lastStep.status === 'fail') {
    if (state.retryCount < 5) return "reviser";
    return "finalizer";
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

const workflow = new StateGraph(AgentState)
  // Nodes
  .addNode("resource_selector", resourceSelector)
  .addNode("planner", planner)
  .addNode("tool_loader", toolLoader)
  .addNode("initialize_step", initializeStep)
  .addNode("capture_dom", captureDom)
  .addNode("executor", executor)
  .addNode("simple_executor", simpleExecutor)
  .addNode("result_collector", resultCollector) // New non-interactive finalizer
  .addNode("validator", validator)
  .addNode("finalizer", finalizer) // Existing interactive finalizer
  .addNode("reviser", reviser)
  
  // Routing
  .addConditionalEdges(START, router, {
    "tool_execution": "tool_loader",
    "tool_making": "resource_selector"
  })

  // Path A: Tool Execution (Completely non-interactive)
  .addEdge("tool_loader", "simple_executor")
  .addEdge("simple_executor", "result_collector")
  .addEdge("result_collector", END)

  // Path B: Tool Making (Interactive & Intelligent)
  .addEdge("resource_selector", "planner")
  .addEdge("planner", "initialize_step")
  .addEdge("initialize_step", "capture_dom")
  .addEdge("capture_dom", "executor")
  .addEdge("executor", "validator")
  .addConditionalEdges("validator", shouldContinue)
  .addEdge("reviser", "initialize_step")
  .addEdge("finalizer", END);

export const graph = workflow.compile();
