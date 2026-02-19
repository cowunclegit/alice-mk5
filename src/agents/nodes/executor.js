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
  
  await logger.info(`Executor: Running step "${keyword}".`);
  
  // Only run the CURRENT step
  const action = {
    keyword: state.currentStep.keyword,
    args: state.currentStep.args || []
  };

  const stepNumber = state.completedSteps.length + 1;
  const result = await RobotBridge.runKeyword(action.keyword, action.args, state.sessionId, state.selectedResources);
  
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
