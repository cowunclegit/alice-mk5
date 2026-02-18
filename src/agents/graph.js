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
import { RobotBridge } from "../services/robot_bridge.js";
import fs from 'fs/promises';
import path from 'path';

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

const captureDom = async (state, config) => {
  const logger = config.configurable.logger;
  
  // Only capture if:
  // 1. Current step needs a selector
  // 2. We don't have HTML yet
  // 3. We have at least one successful step in history (browser is open)
  const hasBrowserHistory = state.completedSteps.some(s => s.status === 'pass');

  if (state.currentStep && !state.currentStep.selector && !state.currentHTML && hasBrowserHistory) {
    await logger.info('Graph: Capturing DOM for element discovery...');
    
    const mapToAction = (step) => {
      const sBrowser = ['Open Visible Browser', 'Navigate To URL', 'Capture DOM Source'].includes(step.keyword);
      const sValidSel = step.selector && typeof step.selector === 'string' && step.selector.trim() !== '' && step.selector.toLowerCase() !== 'null';
      const sArgs = Array.isArray(step.args) ? step.args : [];
      return {
        keyword: step.keyword,
        args: (sValidSel && !sBrowser) ? [step.selector, ...sArgs] : sArgs
      };
    };

    const historyActions = state.completedSteps.filter(s => s.status === 'pass').map(s => mapToAction(s.action));
    
    const result = await RobotBridge.runSequence([
      ...historyActions,
      { keyword: 'Capture DOM Source', args: ['dom.html'] }
    ], state.completedSteps.length + 1, state.sessionId, state.selectedResources);

    let html = '';
    try {
      html = await fs.readFile(path.join(result.tempDir, 'dom.html'), 'utf8');
    } catch (e) {
      await logger.error(`Graph: Failed to read captured DOM: ${e.message}`);
    }

    return {
      currentHTML: html,
      status: 'analyzing'
    };
  }
  return { status: 'analyzing' };
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
  .addNode("validator", validator)
  .addNode("finalizer", finalizer)
  .addNode("reviser", reviser)
  
  // Routing
  .addConditionalEdges(START, router, {
    "tool_execution": "tool_loader",
    "tool_making": "resource_selector"
  })

  // Tool Execution Path
  .addEdge("tool_loader", "simple_executor")
  .addEdge("simple_executor", END)

  // Tool Making Path
  .addEdge("resource_selector", "planner")
  .addEdge("planner", "initialize_step")
  .addEdge("initialize_step", "capture_dom")
  .addEdge("capture_dom", "executor")
  .addEdge("executor", "validator")
  .addConditionalEdges("validator", shouldContinue)
  .addEdge("reviser", "initialize_step")
  .addEdge("finalizer", END);

export const graph = workflow.compile();
