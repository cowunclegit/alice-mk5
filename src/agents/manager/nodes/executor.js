import { createAgentTools, executeSpecializedTool } from "../agent_tools.js";
import { LineageTracker } from "../../common/lineage_tracker.js";

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  const currentTask = state.tasks[state.currentTaskIndex];

  if (!currentTask) {
    return { status: 'finalizing' };
  }

  await logger.info(`ManagerExecutor: Executing task ${currentTask.id} using "${currentTask.tool}" for: "${currentTask.intent}"`);

  // 1. Check if it's a specialized tool
  if (currentTask.tool === 'specialized_tool') {
    try {
      // Use toolId primarily, platform from task is a hint
      const result = await executeSpecializedTool(currentTask.toolId, currentTask.platform, state.dataStore, state.sessionId, config);

      if (result.status === 'finished') {
        return {
          dataStore: result.dataStore,
          currentTaskIndex: state.currentTaskIndex + 1,
          status: 'executing'
        };
      } else {
        return { status: 'error', reasoning: result.reasoning || 'Specialized tool failed.' };
      }
    } catch (e) {
      return { status: 'error', reasoning: `Fatal error in specialized tool: ${e.message}` };
    }
  }

  // 2. Load available agent tools
  const tools = createAgentTools(config);
  const targetTool = tools.find(t => t.name === currentTask.tool);

  if (!targetTool) {
    await logger.error(`ManagerExecutor: Tool "${currentTask.tool}" not found.`);
    return { status: 'error', reasoning: `Agent tool ${currentTask.tool} is missing.` };
  }

  try {
    const startTime = Date.now();
    
    // 2. Execute the sub-agent tool
    // We pass the intent, taskId, sessionId, and current dataStore for context
    const result = await targetTool.execute(currentTask.intent, state.sessionId, state.dataStore, currentTask.id);

    const duration = (Date.now() - startTime) / 1000;
    await logger.info(`ManagerExecutor: Tool "${currentTask.tool}" finished in ${duration.toFixed(2)}s with status: ${result.status}`);

    // 3. Track Lineage (Both input intent and output data)
    let newLineage = LineageTracker.recordUpdate(state.lineage, { [currentTask.id + '_intent']: currentTask.intent }, currentTask.id, 'input');
    newLineage = LineageTracker.recordUpdate(newLineage, result.data, currentTask.id, 'output');

    // 4. Update History
    const historyEntry = {
      taskId: currentTask.id,
      tool: currentTask.tool,
      intent: currentTask.intent,
      status: result.status === 'finished' ? 'finished' : 'error',
      data: result.data,
      files: result.files,
      robot_history: result.history || [],
      timestamp: new Date().toISOString()
    };

    return {
      dataStore: result.data,
      lineage: newLineage,
      history: [historyEntry],
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
