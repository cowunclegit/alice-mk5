import { RobotBridge } from '../../../services/robot_bridge.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.currentStep) {
    return { status: 'validating' };
  }

  const { keyword, args } = state.currentStep;
  await logger.info(`[${state.taskId || 'Web'}] WebExecutor: Running "${keyword}" with args: ${JSON.stringify(args)}`);

  const result = await RobotBridge.runKeyword(keyword, args, state.sessionId, state.selectedResources, logger, state.taskId || '1', state.dataStore);

  return {
    status: 'executing',
    context: { lastResult: result }
  };
};
