import { RobotBridge } from '../../services/robot_bridge.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.currentStep) {
    await logger.error('Executor: No currentStep found in state. Aborting.');
    return {
      status: 'error',
      context: { ...state.context, lastResult: { status: 'fail', stderr: 'No action to execute.' } }
    };
  }

  const { keyword, args } = state.currentStep;
  
  await logger.info(`Executor: Running current session sequence up to "${keyword}".`);
  
  // Construct sequence: All steps in current plan up to current step
  const sessionActions = state.plan.slice(0, state.plan.indexOf(state.currentStep) + 1).map(step => ({
    keyword: step.keyword,
    args: step.args || []
  }));

  const stepNumber = state.completedSteps.length + 1;
  const result = await RobotBridge.runSequence(sessionActions, stepNumber, state.sessionId);
  
  if (result.status === 'pass') {
    await logger.info(`Executor: Success.`);
  } else {
    await logger.error(`Executor: Failed.`);
    await logger.debug(`Robot Stdout: ${result.stdout}`);
    await logger.debug(`Robot Stderr: ${result.stderr}`);
  }

  return {
    status: 'executing',
    context: { ...state.context, lastResult: result }
  };
};
