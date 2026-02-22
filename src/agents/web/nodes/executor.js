import { RobotBridge } from '../../../services/robot_bridge.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.currentStep) {
    return { status: 'validating' };
  }

  const { keyword, args } = state.currentStep;
  await logger.info(`WebExecutor: Running "${keyword}" with args: ${JSON.stringify(args)}`);

  const result = await RobotBridge.runKeyword(keyword, args, state.sessionId, state.selectedResources, logger, '1', state.dataStore);

  return {
    status: 'executing',
    context: { lastResult: result }
  };
};
