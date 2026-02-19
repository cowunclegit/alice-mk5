import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const validator = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const lastResult = state.context.lastResult;

  await logger.debug(`AppValidator: Evaluating step outcome.`);

  if (!state.currentStep) {
    return { status: 'finished' };
  }

  const systemPrompt = `You are a desktop application automation validator.
Determine if the last action successfully met the step's goal.

Respond ONLY with a JSON object:
{
  "success": true/false,
  "reasoning": "Why"
}
`;

  const userPrompt = `Step Intent: ${state.currentStep.intent}
Execution Result: ${JSON.stringify(lastResult)}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  return {
    completedSteps: [{ action: state.currentStep, status: parsed.success ? 'pass' : 'fail', result: lastResult }],
    status: parsed.success ? 'validating' : 'fail',
    reasoning: parsed.reasoning,
    currentStep: null
  };
};
