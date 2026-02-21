/**
 * LineageTracker utility to track data origin and flow between agent tasks.
 */
export class LineageTracker {
  /**
   * Records an update to the dataStore with lineage information.
   * 
   * @param {Object} currentLineage - The current lineage state
   * @param {Object} update - Key-value pairs being updated
   * @param {string} taskId - The ID of the task performing the update
   * @param {'input' | 'output'} type - The type of data
   * @returns {Object} Updated lineage state
   */
  static recordUpdate(currentLineage = {}, update = {}, taskId, type = 'output') {
    const newLineage = { ...currentLineage };
    
    for (const [key, value] of Object.entries(update)) {
      newLineage[key] = {
        value,
        taskId,
        type,
        timestamp: new Date().toISOString()
      };
    }
    
    return newLineage;
  }

  /**
   * Finds the lineage source for a specific value.
   * Useful for templatization to find which task produced a literal value.
   */
  static findSource(lineage, value) {
    // Exact match for now
    for (const [key, info] of Object.entries(lineage)) {
      if (info.value === value) {
        return info;
      }
    }
    return null;
  }
}
