import { RobotBridge } from '../../../services/robot_bridge.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.currentStep) {
    return { status: 'validating' };
  }

  const stepsToRun = state.batch && state.batch.length > 0 ? state.batch : [state.currentStep];
  
  if (stepsToRun.length > 1) {
    await logger.info(`[${state.taskId || 'Web'}] WebExecutor: Batch running ${stepsToRun.length} steps...`);
  } else {
    const { keyword, args } = state.currentStep;
    await logger.info(`[${state.taskId || 'Web'}] WebExecutor: Running "${keyword}" with args: ${JSON.stringify(args)}`);
  }

  const result = await RobotBridge.runSequence(stepsToRun, state.taskId || '1', state.sessionId, state.selectedResources, logger, state.dataStore);

  return {
    status: 'executing',
    context: { lastResult: result }
  };
};
