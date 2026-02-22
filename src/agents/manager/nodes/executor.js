import { createAgentTools } from "../agent_tools.js";
import { LineageTracker } from "../../common/lineage_tracker.js";
import { VariableResolver } from "../../../lib/variable_resolver.js";

/**
 * Executor node to dispatch tasks to sub-agents.
 * No longer supports specialized tools as they are replaced by resource management.
 */
export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  const currentTask = state.tasks[state.currentTaskIndex];

  if (!currentTask) {
    return { status: 'finalizing' };
  }

  // RESOLVE VARIABLES in intent before execution
  const resolvedIntent = VariableResolver.resolve(currentTask.intent, state.dataStore);

  await logger.info(`ManagerExecutor: Executing task ${currentTask.id} using "${currentTask.tool}" for: "${resolvedIntent}"`);

  // 1. Load available agent tools
  const tools = createAgentTools(config);
  const targetTool = tools.find(t => t.name === currentTask.tool);

  if (!targetTool) {
    await logger.error(`ManagerExecutor: Tool "${currentTask.tool}" not found.`);
    return { status: 'error', reasoning: `Agent tool ${currentTask.tool} is missing.` };
  }

  try {
    const startTime = Date.now();
    
    // 2. Execute the sub-agent tool with RESOLVED intent
    const result = await targetTool.execute(resolvedIntent, state.sessionId, state.dataStore, currentTask.id);

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

    const isSuccess = result.status === 'finished';

    return {
      dataStore: result.data,
      lineage: newLineage,
      history: [historyEntry],
      currentTaskIndex: isSuccess ? state.currentTaskIndex + 1 : state.currentTaskIndex,
      status: isSuccess ? 'executing' : 'error',
      reasoning: isSuccess ? '' : `Sub-agent ${currentTask.tool} failed.`
    };

  } catch (e) {
    await logger.error(`ManagerExecutor: Fatal error during tool execution: ${e.message}`);
    return {
      status: 'error',
      reasoning: e.message
    };
  }
};
