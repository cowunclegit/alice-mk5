/**
 * Service for managing agent execution history with rolling window support.
 */
export class HistoryService {
  /**
   * Limits the history to the most recent N turns.
   * Ensures that tool use and result pairs are kept together.
   * @param {Array} history 
   * @param {number} limit 
   * @returns {Array}
   */
  static limitTurns(history, limit = 5) {
    if (!history || history.length === 0) return [];
    
    if (history.length <= limit) return history;
    
    return history.slice(-limit);
  }

  /**
   * Formats history into a human-readable and AI-friendly string.
   * @param {Array} history 
   * @returns {string}
   */
  static format(history) {
    if (!history || history.length === 0) return "No previous actions.";
    
    return history.map((h, i) => {
      const status = h.status === 'pass' ? 'SUCCESS' : 'FAILED';
      const detail = h.reasoning ? ` - ${h.reasoning}` : '';
      return `${i + 1}. ${h.action.keyword} (${h.action.intent}): ${status}${detail}`;
    }).join('\n');
  }
}
