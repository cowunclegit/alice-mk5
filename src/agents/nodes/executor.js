import { RobotBridge } from '../../services/robot_bridge.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  const { keyword, selector, args } = state.currentStep;
  
  const browserKeywords = ['Open Visible Browser', 'Navigate To URL', 'Capture DOM Source'];
  const isBrowserKeyword = browserKeywords.includes(keyword);
  const hasValidSelector = selector && typeof selector === 'string' && selector.trim() !== '' && selector.toLowerCase() !== 'null' && selector.toLowerCase() !== 'none';

  // Semantic check before execution
  if (!isBrowserKeyword && !hasValidSelector) {
    await logger.error(`Executor: Missing selector for keyword "${keyword}". Aborting step execution.`);
    return {
      status: 'executing',
      context: { ...state.context, lastResult: { status: 'fail', stderr: 'Execution aborted: No element selector was found for this interaction.' } }
    };
  }

  // Helper to map an action to robot-friendly args
  const mapToAction = (step) => {
    const sBrowser = browserKeywords.includes(step.keyword);
    const sValidSel = step.selector && typeof step.selector === 'string' && step.selector.trim() !== '' && step.selector.toLowerCase() !== 'null' && step.selector.toLowerCase() !== 'none';
    const sArgs = Array.isArray(step.args) ? step.args : [];
    
    return {
      keyword: step.keyword,
      args: (sValidSel && !sBrowser) ? [step.selector, ...sArgs] : sArgs
    };
  };

  const currentAction = mapToAction(state.currentStep);

  await logger.info(`Executor: Running cumulative session sequence (Steps 1 to ${state.completedSteps.length + 1}).`);
  
  // Construct sequence: Previous successful steps + current step
  const sessionActions = [
    ...state.completedSteps.filter(s => s.status === 'pass').map(s => mapToAction(s.action)),
    currentAction
  ];

  const stepNumber = state.completedSteps.length + 1;
  const result = await RobotBridge.runSequence(sessionActions, stepNumber, state.sessionId);
  
  if (result.status === 'pass') {
    await logger.info(`Executor: Keyword "${keyword}" passed.`);
  } else {
    await logger.error(`Executor: Keyword "${keyword}" failed.`);
    await logger.debug(`Robot Stdout: ${result.stdout}`);
    await logger.debug(`Robot Stderr: ${result.stderr}`);
  }

  return {
    status: 'executing',
    currentHTML: isBrowserKeyword ? null : state.currentHTML, // Force fresh DOM after navigation
    context: { ...state.context, lastResult: result }
  };
};
