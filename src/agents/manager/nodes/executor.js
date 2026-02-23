import { createAgentTools } from "../agent_tools.js";
import { LineageTracker } from "../../common/lineage_tracker.js";

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (state.currentTaskIndex >= state.tasks.length) {
    return { status: 'finalizing' };
  }

  const currentTask = state.tasks[state.currentTaskIndex];
  await logger.info(`ManagerExecutor: Executing task ${currentTask.id} (${currentTask.tool}): "${currentTask.intent}"`);

  const tools = createAgentTools(config);
  const targetTool = tools.find(t => t.name === currentTask.tool);

  if (!targetTool) {
    return { 
      status: 'error', 
      reasoning: `Tool ${currentTask.tool} not found.` 
    };
  }

  try {
    // Collect all previous robot steps to pass back to the sub-agent
    const previousSteps = (state.history || [])
      .filter(h => h.steps)
      .flatMap(h => h.steps);

    const result = await targetTool.execute(currentTask.intent, state.sessionId, state.dataStore, currentTask.id, state.input, previousSteps);
    
    // Lineage and History
    let newLineage = LineageTracker.recordUpdate(state.lineage, { [currentTask.id + '_intent']: currentTask.intent }, currentTask.id, 'input');
    newLineage = LineageTracker.recordUpdate(newLineage, result.data, currentTask.id, 'output');

    const historyEntry = {
      taskId: currentTask.id,
      tool: currentTask.tool,
      intent: currentTask.intent,
      status: result.status,
      data: result.data,
      steps: result.history, // Include the robot steps in Manager history
      timestamp: new Date().toISOString()
    };

    if (result.status === 'finished') {
      return {
        dataStore: result.data,
        lineage: newLineage,
        history: [historyEntry],
        currentTaskIndex: state.currentTaskIndex + 1,
        status: 'executing' // Continue to next task or finalize
      };
    } else {
      // Task Failed -> Trigger Replanning
      await logger.warn(`ManagerExecutor: Task ${currentTask.id} failed. Initiating replan.`);
      return {
        history: [historyEntry],
        status: 'replanning',
        reasoning: `Task ${currentTask.id} failed: ${result.reasoning || 'Unknown error'}`
      };
    }

  } catch (e) {
    return { status: 'error', reasoning: e.message };
  }
};
