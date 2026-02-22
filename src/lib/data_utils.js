/**
 * DataUtils provides utilities for managing and compacting the shared dataStore.
 */
export class DataUtils {
  /**
   * Compacts the dataStore to keep it within token limits.
   * Prunes old entries and keeps only essential metadata for older files.
   * @param {Object} dataStore - The current data store.
   * @param {number} maxEntries - Maximum number of full entries to keep.
   * @returns {Object} Compacted data store.
   */
  static compact(dataStore, maxEntries = 20) {
    const keys = Object.keys(dataStore);
    if (keys.length <= maxEntries) return dataStore;

    // Sort by timestamp (newest first)
    const sortedEntries = Object.entries(dataStore)
      .sort(([, a], [, b]) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

    const compacted = {};
    sortedEntries.forEach(([key, value], index) => {
      if (index < maxEntries) {
        // Keep recent entries full
        compacted[key] = value;
      } else {
        // For older entries, keep only the most critical info (path or type)
        if (typeof value === 'object' && value !== null) {
          compacted[key] = {
            type: value.type,
            path: value.path,
            summary: "Compacted due to age",
            timestamp: value.timestamp
          };
        } else {
          // If it's a primitive, just keep it (usually small)
          compacted[key] = value;
        }
      }
    });

    return compacted;
  }
}
