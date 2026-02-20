import { extractAndParseJSON } from '../lib/json_utils.js';

export class CompactionService {
  static async compactDataStore(dataStore, config, model, logger) {
    const maxKeys = config.orchestration?.compaction?.maxKeys || 10;
    const keys = Object.keys(dataStore);

    if (keys.length <= maxKeys) {
      return dataStore;
    }

    await logger.info(`CompactionService: data_store size (${keys.length}) exceeds threshold (${maxKeys}). Summarizing oldest entries.`);

    // Sort keys by some heuristic if possible, or just take the first N
    // Assuming keys are somewhat chronological if added by sub-agents
    const keysToCompact = keys.slice(0, keys.length - Math.floor(maxKeys / 2));
    const dataToCompact = {};
    const remainingData = {};

    for (const key of keys) {
      if (keysToCompact.includes(key)) {
        dataToCompact[key] = dataStore[key];
      } else {
        remainingData[key] = dataStore[key];
      }
    }

    const systemPrompt = `You are a data compaction assistant.
Summarize the following JSON data into a single concise "archived_summary" object.
Keep only the most critical information that might be needed for future reasoning.
Respond ONLY with a JSON object.
`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(dataToCompact) }
    ]);

    try {
      const summary = extractAndParseJSON(response.content);
      return {
        ...remainingData,
        archived_summary: {
          ...(remainingData.archived_summary || {}),
          ...summary
        }
      };
    } catch (e) {
      await logger.error(`CompactionService: Failed to parse summary: ${e.message}. Preserving data.`);
      return dataStore;
    }
  }
}
