import { RobotBridge } from '../../services/robot_bridge.js';

export const simpleExecutor = async (state, config) => {
  const logger = config.configurable.logger;
  
  await logger.info('SimpleExecutor: Executing all tool steps in a single sequence.');
  
  const sessionActions = state.plan.map(step => ({
    keyword: step.keyword,
    args: step.args || []
  }));

  const result = await RobotBridge.runSequence(sessionActions, 1, state.sessionId);
  
  const completed = sessionActions.map(a => ({ action: a, result, status: result.status }));

  return {
    completedSteps: completed,
    status: result.status === 'pass' ? 'finished' : 'error'
  };
};
