import { extractAndParseJSON } from '../../lib/json_utils.js';

export const validator = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const lastResult = state.context.lastResult;
  const completed = state.completedSteps || [];

  await logger.debug(`Validator: Evaluating last step outcome.`);

  const systemPrompt = `You are a web automation validator.
Given the original user intent, the action performed, and the execution result, determine if the goal was met.

### CRITICAL RULES:
- If the action was "Press Enter" or "Click" to submit a search, verify that the browser actually navigated or the state changed.
- If navigation failed or was skipped, the intent is NOT fulfilled.
- If the result text is empty but the user wanted data, the intent is NOT fulfilled.

Respond ONLY with a JSON object in the format:
{
  "success": true/false,
  "reasoning": "Brief explanation"
}
`;

  const userPrompt = `Intent: ${state.input}
Action Intent: ${state.currentStep.intent}
Execution Result: ${JSON.stringify(lastResult)}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  if (parsed.success) {
    await logger.info(`Validator: Intent fulfilled.`);
  } else {
    await logger.info(`Validator: Intent NOT fulfilled. Reason: ${parsed.reasoning}`);
  }

  const stepResult = {
    action: state.currentStep,
    result: lastResult,
    status: parsed.success ? 'pass' : 'fail',
    reasoning: parsed.reasoning
  };

  return {
    completedSteps: [stepResult], // Reducer will concat this
    currentStep: null,
    status: 'validating'
  };
};
