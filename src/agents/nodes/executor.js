import { RobotBridge } from '../../services/robot_bridge.js';

/**
 * Resolves references and executes robot actions.
 * @param {Object} state 
 * @param {Object} config 
 * @returns {Object} Updated state
 */
export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.currentStep) {
    await logger.error('Executor: No currentStep found in state. Aborting.');
    return { status: 'error' };
  }

  const { keyword, args = [] } = state.currentStep;
  
  // 1. Resolve references (e.g. "e1" -> "#submit")
  const resolvedArgs = args.map(arg => {
    if (typeof arg === 'string' && arg.match(/^e\d+$/)) {
      const resolved = state.refMap[arg];
      if (resolved) {
        logger.debug(`Executor: Resolved ${arg} to selector: ${resolved}`);
        return resolved;
      }
      logger.info(`Executor: Could not resolve reference ${arg}. Using raw value.`);
    }
    return arg;
  });

  await logger.info(`Executor: Running current session sequence up to "${keyword}".`);
  
  // 2. Map history to actions for cumulative execution
  const mapToAction = (step) => ({
    keyword: step.keyword,
    args: step.args || []
  });

  const historyActions = state.completedSteps
    .filter(s => s.status === 'pass')
    .map(s => mapToAction(s.action));

  const currentAction = { keyword, args: resolvedArgs };
  
  const stepNumber = state.completedSteps.length + 1;
  const result = await RobotBridge.runSequence(
    [...historyActions, currentAction], 
    stepNumber, 
    state.sessionId, 
    state.selectedResources
  );
  
  if (result.status === 'pass') {
    await logger.info(`Executor: Technical success.`);
  } else {
    await logger.error(`Executor: Technical failure.`);
    await logger.debug(`Robot Stderr: ${result.stderr}`);
  }

  return {
    completedSteps: [{
      action: { ...state.currentStep, args: resolvedArgs }, // Log resolved action
      result: result,
      status: result.status
    }],
    status: 'executing'
  };
};
