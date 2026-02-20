import { createAgentTools } from "../agent_tools.js";

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  const currentTask = state.tasks[state.currentTaskIndex];

  if (!currentTask) {
    return { status: 'finalizing' };
  }

  await logger.info(`ManagerExecutor: Executing task ${currentTask.id} using "${currentTask.tool}" for: "${currentTask.intent}"`);

  // 1. Load available agent tools
  const tools = createAgentTools(config);
  const targetTool = tools.find(t => t.name === currentTask.tool);

  if (!targetTool) {
    await logger.error(`ManagerExecutor: Tool "${currentTask.tool}" not found.`);
    return { status: 'error', reasoning: `Agent tool ${currentTask.tool} is missing.` };
  }

  try {
    const startTime = Date.now();
    
    // 2. Execute the sub-agent tool
    // We pass the intent, sessionId, and current dataStore for context
    const result = await targetTool.execute(currentTask.intent, state.sessionId, state.dataStore);

    const duration = (Date.now() - startTime) / 1000;
    await logger.info(`ManagerExecutor: Tool "${currentTask.tool}" finished in ${duration.toFixed(2)}s with status: ${result.status}`);

    return {
      dataStore: result.data,
      currentTaskIndex: state.currentTaskIndex + 1,
      status: result.status === 'finished' ? 'executing' : 'error',
      reasoning: result.status === 'finished' ? '' : `Sub-agent ${currentTask.tool} failed.`
    };

  } catch (e) {
    await logger.error(`ManagerExecutor: Fatal error during tool execution: ${e.message}`);
    return {
      status: 'error',
      reasoning: e.message
    };
  }
};
