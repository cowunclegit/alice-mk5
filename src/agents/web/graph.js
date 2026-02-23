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
  const lastStep = state.completedSteps && state.completedSteps.length > 0 
    ? state.completedSteps[state.completedSteps.length - 1] 
    : null;
  
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

  // BATCHING LOGIC: Find consecutive steps that don't need AXTree analysis
  const specializedKeywords = [
    'Search Naver', 
    'Click Naver News Tab', 
    'Extract Naver News Results',
    'Open Visible Browser',
    'Navigate To URL',
    'Close Session Browser',
    'Extract All Links',
    'Wait For Element',
    'Analyze Data',
    'Summarize Results',
    'Read Local Data'
  ];

  const batch = [];
  let i = 0;
  while (i < state.remainingSteps.length) {
    const step = state.remainingSteps[i];
    if (!step) break;
    
    const isSpecialized = specializedKeywords.includes(step.keyword);
    const hasSelector = step.selector && step.selector !== '' && step.selector !== '""' && step.selector !== 'null';
    
    // If it's the first step, always take it
    // If it's a subsequent step, only take it if it doesn't need AXTree (is specialized or has selector)
    if (i === 0 || isSpecialized || hasSelector) {
      batch.push(step);
      i++;
      // If the current step just added needs analysis NEXT, stop batching
      if (!specializedKeywords.includes(step.keyword) && !hasSelector) break;
    } else {
      break;
    }
  }

  if (batch.length === 0) {
    return { status: 'error', reasoning: 'Failed to generate task batch.' };
  }

  const currentStep = batch[0];
  const remaining = state.remainingSteps.slice(batch.length);
  
  return {
    currentStep: currentStep,
    batch: batch, // Store the batch for the executor
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
