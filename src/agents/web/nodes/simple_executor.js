import { RobotBridge } from '../../../services/robot_bridge.js';

export const simpleExecutor = async (state, config) => {
  const logger = config.configurable.logger;
  
  await logger.info(`SimpleExecutor: Executing ${state.plan.length} steps from tool.`);
  
  const completed = [];
  const remaining = [...state.plan];

  // For each step in the tool, we want to allow for optional analysis 
  // if the selector is missing. But since this is a "simple" executor for 
  // pre-verified tools, we assume the keywords are high-level.
  
  // However, if we want to support dynamic selectors in tools, 
  // we should actually route these back through the full webAgent cycle.
  // For now, let's keep it simple but fix the variable passing.

  for (let i = 0; i < state.plan.length; i++) {
    const step = state.plan[i];
    await logger.info(`SimpleExecutor: Running step ${i+1}/${state.plan.length}: ${step.keyword}`);
    
    const result = await RobotBridge.runKeyword(step.keyword, step.args || [], state.sessionId, state.selectedResources, logger);
    
    completed.push({
      action: step,
      result: result,
      status: result.status
    });

    if (result.status === 'fail') {
      await logger.error(`SimpleExecutor: Step failed. Aborting.`);
      return { completedSteps: completed, status: 'error' };
    }
  }

  return {
    completedSteps: completed,
    status: 'finished'
  };
};
