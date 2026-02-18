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
  .addNode("planner", planner)
  .addNode("tool_loader", toolLoader)
  .addNode("initialize_step", initializeStep)
  .addNode("executor", executor)
  .addNode("simple_executor", simpleExecutor)
  .addNode("validator", validator)
  .addNode("finalizer", finalizer)
  .addNode("reviser", reviser)
  
  // Routing
  .addConditionalEdges(START, router, {
    "tool_execution": "tool_loader",
    "tool_making": "planner"
  })

  // Tool Execution Path (Fast & Simple)
  .addEdge("tool_loader", "simple_executor")
  .addEdge("simple_executor", END)

  // Tool Making Path (Dynamic & Intelligent)
  .addEdge("planner", "initialize_step")
  .addEdge("initialize_step", "executor")
  .addEdge("executor", "validator")
  .addConditionalEdges("validator", shouldContinue)
  .addEdge("reviser", "initialize_step")
  .addEdge("finalizer", END);

export const graph = workflow.compile();
