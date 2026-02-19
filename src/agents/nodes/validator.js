import { extractAndParseJSON } from '../../lib/json_utils.js';

/**
 * Performs semantic verification of an action using the latest AXTREE.
 * @param {Object} state 
 * @param {Object} config 
 * @returns {Object} Updated state
 */
export const validator = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  const axTreeText = state.axTree?.serialized || "No UI state available.";

  await logger.info(`Validator: Performing semantic verification for "${lastStep.action.keyword}"...`);

  const systemPrompt = `You are a web automation validator.
Evaluate if the last action successfully fulfilled its intent based on the updated UI state.

### CONTEXT
- **Goal**: ${state.input}
- **Last Action**: ${lastStep.action.keyword} (${lastStep.action.intent})
- **Updated UI State (AXTREE)**:
${axTreeText}

### CRITICAL RULES:
1. Determine if the action worked as intended (e.g., if clicking "Search" resulted in a results page).
2. If the UI state indicates failure (e.g., error message visible, page didn't change), mark as success: false.
3. If the entire goal has been met, explicitly mention it in the reasoning.

Respond ONLY with a JSON object:
{
  "success": true/false,
  "intentMet": true/false, // Whether the ENTIRE user goal is now complete
  "reasoning": "Brief explanation"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: "Evaluate the outcome." }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  // We don't overwrite completedSteps here because it's already recorded in executor.
  // We update the last step's status if needed, or set context flags.
  
  const updatedHistory = [...state.completedSteps];
  const lastIdx = updatedHistory.length - 1;
  updatedHistory[lastIdx].status = parsed.success ? 'pass' : 'fail';
  updatedHistory[lastIdx].reasoning = parsed.reasoning;

  if (parsed.success) {
    await logger.info(`Validator: Step verified. ${parsed.reasoning}`);
  } else {
    await logger.info(`Validator: Step failed semantic check. ${parsed.reasoning}`);
  }

  return {
    context: {
      intentMet: parsed.intentMet,
      lastValidatedStepIndex: lastIdx
    },
    status: parsed.intentMet ? 'finished' : 'validating'
  };
};
