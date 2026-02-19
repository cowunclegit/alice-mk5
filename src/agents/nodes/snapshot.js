import { HistoryService } from '../../services/history_service.js';

/**
 * Generates an AI-optimized ROLE Snapshot prompt component.
 * @param {Object} state 
 * @param {Object} config 
 * @returns {Object} Updated state
 */
export const snapshotNode = async (state, config) => {
  const logger = config.configurable.logger;
  
  await logger.debug('SnapshotNode: Generating ROLE Snapshot...');

  const axTreeText = state.axTree?.serialized || "No UI state available.";
  const limitedHistory = HistoryService.limitTurns(state.completedSteps, 5);
  const historyText = HistoryService.format(limitedHistory);

  const snapshot = `
### CURRENT ROLE
You are an expert web automation agent.

### OBJECTIVE
${state.input}

### PERCEIVED UI STATE (AXTREE)
${axTreeText}

### RECENT EXECUTION HISTORY
${historyText}

### INSTRUCTIONS
1. Analyze the UI state and history.
2. Decide on the next set of actions using the available [ref=eX] identifiers.
3. If the objective is met, signal completion.
`;

  return {
    snapshot: snapshot,
    status: 'planning' // Transition status
  };
};
