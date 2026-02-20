import { applicationAgent } from "../../application/index.js";
import { webAgent } from "../../web/index.js";
import { HandoffUtils } from "../../../lib/handoff_utils.js";
import { CompactionService } from "../../../services/compaction_service.js";

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const currentTask = state.tasks[state.currentTaskIndex];

  if (!currentTask) {
    return { status: 'finalizing' };
  }

  await logger.info(`ManagerExecutor: Dispatching task "${currentTask.intent}" to ${currentTask.platform} sub-agent.`);

  const startTime = Date.now();
  const subAgentInput = HandoffUtils.formatInput(currentTask, state);
  let subAgentResult;

  try {
    if (currentTask.platform === 'web') {
      subAgentResult = await webAgent.invoke(subAgentInput, config);
    } else if (currentTask.platform === 'application') {
      subAgentResult = await applicationAgent.invoke(subAgentInput, config);
    } else {
      throw new Error(`Unsupported platform: ${currentTask.platform}`);
    }

    const duration = (Date.now() - startTime) / 1000;
    await logger.info(`ManagerExecutor: Sub-agent task completed in ${duration.toFixed(2)}s.`);

    const validated = HandoffUtils.validateOutput(subAgentResult);
    
    // Merge result into data_store
    let newDataStore = { ...state.dataStore, ...validated.data };
    
    // Check for compaction
    const orchestrationConfig = config.configurable.config?.orchestration || {};
    newDataStore = await CompactionService.compactDataStore(newDataStore, orchestrationConfig, model, logger);

    return {
      dataStore: newDataStore,
      currentTaskIndex: state.currentTaskIndex + 1,
      history: validated.history,
      status: 'executing'
    };

  } catch (e) {
    await logger.error(`ManagerExecutor: Sub-agent failed: ${e.message}`);
    return {
      status: 'error',
      reasoning: e.message
    };
  }
};
