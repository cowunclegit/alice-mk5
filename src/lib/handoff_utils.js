export class HandoffUtils {
  /**
   * Standardizes the input for sub-agents.
   */
  static formatInput(task, state) {
    return {
      intent: task.intent,
      originalInput: state.input,
      sessionId: state.sessionId,
      dataStore: state.dataStore || {},
      retryCount: 0,
      isSubAgent: true // Signal to sub-graph to run in non-interactive mode
    };
  }

  /**
   * Validates sub-agent output.
   */
  static validateOutput(result) {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid sub-agent output: not an object');
    }
    
    // Status is expected but optional for robustness
    const status = result.status || 'finished';
    
    return {
      status,
      data: result.dataStore || result.result_data || {},
      history: result.completedSteps || result.history || []
    };
  }
}
