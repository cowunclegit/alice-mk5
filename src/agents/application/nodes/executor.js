import { RobotBridge } from '../../../services/robot_bridge.js';
import { AppiumService } from '../../../services/appium/index.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.currentStep) {
    return { status: 'error' };
  }

  const { keyword, args, selector } = state.currentStep;
  const finalArgs = selector ? [selector, ...args] : args;

  await logger.info(`AppExecutor: Running step "${keyword}" with args: ${JSON.stringify(finalArgs)}`);

  // Ensure Appium variables are passed to the Robot script
  // We need to modify RobotBridge or use a similar approach
  
  const result = await RobotBridge.runKeyword(keyword, finalArgs, state.sessionId, state.selectedResources);

  if (result.status === 'pass') {
    await logger.info(`AppExecutor: Success.`);
  } else {
    await logger.error(`AppExecutor: Failed.`);
  }

  return {
    status: 'executing',
    context: { ...state.context, lastResult: result }
  };
};
