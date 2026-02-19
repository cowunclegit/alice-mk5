import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const reviser = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  await logger.info(`AppReviser: Attempting recovery. Attempt ${state.retryCount + 1}/5`);

  const systemPrompt = `You are a desktop application automation reviser.
A step has failed. Analyze history and fix the remaining plan.
Respond ONLY with JSON:
{
  "revisedRemainingSteps": [...],
  "reasoning": "Why"
}
`;

  const userPrompt = `Intent: ${state.intent}
History: ${JSON.stringify(state.completedSteps)}
Original Remaining: ${JSON.stringify(state.remainingSteps)}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  return {
    remainingSteps: parsed.revisedRemainingSteps,
    retryCount: (state.retryCount || 0) + 1,
    status: 'revising',
    reasoning: parsed.reasoning
  };
};
