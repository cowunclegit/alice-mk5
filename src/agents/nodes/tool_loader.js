import { StorageService } from '../../services/storage_service.js';

export const toolLoader = async (state, config) => {
  const logger = config.configurable.logger;
  const input = state.input.toLowerCase();
  const toolId = input.replace('run tool ', '').replace('use tool ', '').trim();
  
  await logger.info(`Router: Routing to Tool Execution for "${toolId}"`);
  
  try {
    const sequence = await StorageService.loadSequence(toolId);
    return {
      plan: sequence.actions,
      remainingSteps: sequence.actions,
      status: 'executing',
      reasoning: `Executing verified tool: ${toolId}`
    };
  } catch (e) {
    throw new Error(`Tool "${toolId}" not found.`);
  }
};
