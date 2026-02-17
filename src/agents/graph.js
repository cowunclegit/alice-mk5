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
  const browserKeywords = ['Open Visible Browser', 'Navigate To URL'];
  const isSetupStep = browserKeywords.includes(state.currentStep.keyword);

  if (!state.currentStep.selector && !state.currentHTML && !isSetupStep) {
    await logger.info('Graph: Capturing DOM for element discovery...');
    
    // Helper to map an action to robot-friendly args (Consistent with Executor)
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
    ], state.completedSteps.length + 1, state.sessionId);

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
