import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { planner } from "./nodes/planner.js";
import { executor } from "./nodes/executor.js";
import { validator } from "./nodes/validator.js";
import { finalizer } from "./nodes/finalizer.js";
import { reviser } from "./nodes/reviser.js";
import { resourceSelector } from "./nodes/resource_selector.js";
import { resultCollector } from "./nodes/result_collector.js";
import { captureDom } from "./nodes/capture_dom.js";
import { analyzer } from "./nodes/analyzer.js";

const shouldContinue = (state) => {
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  
  if (lastStep && lastStep.status === 'fail') {
    if (state.retryCount < 3) return "reviser";
    return state.isSubAgent ? "result_collector" : "finalizer";
  }

  if (state.remainingSteps && state.remainingSteps.length > 0) {
    return "initialize_step";
  }
  
  return state.isSubAgent ? "result_collector" : "finalizer";
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
  .addNode("resource_selector", resourceSelector)
  .addNode("planner", planner)
  .addNode("initialize_step", initializeStep)
  .addNode("capture_dom", captureDom)
  .addNode("analyzer", analyzer)
  .addNode("executor", executor)
  .addNode("validator", validator)
  .addNode("result_collector", resultCollector)
  .addNode("finalizer", finalizer)
  .addNode("reviser", reviser)
  
  // Start
  .addEdge(START, "resource_selector")
  
  // Planning
  .addEdge("resource_selector", "planner")
  .addEdge("planner", "initialize_step")
  
  // Execution Loop
  .addEdge("initialize_step", "capture_dom")
  .addEdge("capture_dom", "analyzer")
  .addEdge("analyzer", "executor")
  .addEdge("executor", "validator")
  
  // Decisions
  .addConditionalEdges("validator", shouldContinue)
  
  // Retry / End
  .addEdge("reviser", "initialize_step")
  .addEdge("result_collector", END)
  .addEdge("finalizer", END);

export const graph = workflow.compile();
