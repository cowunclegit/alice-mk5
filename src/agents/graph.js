import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { planner } from "./nodes/planner.js";
import { analyzer } from "./nodes/analyzer.js";
import { executor } from "./nodes/executor.js";
import { validator } from "./nodes/validator.js";
import { clarifier } from "./nodes/clarifier.js";
import { finalizer } from "./nodes/finalizer.js";
import { reviser } from "./nodes/reviser.js";
import { RobotBridge } from "../services/robot_bridge.js";

const shouldContinue = (state) => {
  // Check for failures requiring revision
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  if (lastStep.status === 'fail') {
    if (state.retryCount < 5) {
      return "reviser";
    } else {
      return "finalizer"; // Transition to intervention
    }
  }

  if (state.remainingSteps && state.remainingSteps.length > 0) {
    return "initialize_step";
  }
  return "finalizer";
};

const initializeStep = (state) => {
  const nextStep = state.remainingSteps[0];
  const remaining = state.remainingSteps.slice(1);
  return {
    currentStep: nextStep,
    remainingSteps: remaining,
    status: 'executing'
  };
};

const captureDom = async (state) => {
  // Only capture if we need a selector or if it's the first step
  if (!state.currentStep.selector) {
    const result = await RobotBridge.runKeyword('Capture DOM Source', []);
    return {
      currentHTML: result.stdout,
      status: 'analyzing'
    };
  }
  return { status: 'executing' };
};

const workflow = new StateGraph(AgentState)
  .addNode("planner", planner)
  .addNode("initialize_step", initializeStep)
  .addNode("capture_dom", captureDom)
  .addNode("analyzer", analyzer)
  .addNode("clarifier", clarifier)
  .addNode("executor", executor)
  .addNode("validator", validator)
  .addNode("finalizer", finalizer)
  .addNode("reviser", reviser)
  
  .addEdge(START, "planner")
  .addEdge("planner", "initialize_step")
  .addEdge("initialize_step", "capture_dom")
  .addEdge("capture_dom", "analyzer")
  .addEdge("analyzer", "clarifier")
  .addEdge("clarifier", "executor")
  .addEdge("executor", "validator")
  .addConditionalEdges("validator", shouldContinue)
  .addEdge("reviser", "initialize_step")
  .addEdge("finalizer", END);

export const graph = workflow.compile();
