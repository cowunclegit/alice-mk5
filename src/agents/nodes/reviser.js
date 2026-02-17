import { extractAndParseJSON } from '../../lib/json_utils.js';

export const reviser = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  await logger.info(`Reviser: Attempting to recover from failure. Attempt ${state.retryCount + 1}/5`);

  const systemPrompt = `You are a web automation reviser.
A step has failed. Analyze history and original intent to fix the REMAINING plan.

### Available Keywords:
1. "Open Visible Browser" - Args: ["URL"] (URL MUST include https://)
2. "Navigate To URL" - Args: ["URL"] (URL MUST include https://)
3. "Wait For Element" - Intent: "Goal", Selector: null
4. "Click Element" - Intent: "Goal", Args: [], Selector: null
5. "Type Into Element" - Intent: "Goal", Args: ["Text"], Selector: null
6. "Press Enter" - Intent: "Submit or confirm", Selector: null
7. "Capture DOM Source" - No args.
8. "Extract Element Data" - Intent: "Goal", Selector: null.

### CRITICAL RULES:
- Use ONLY the keyword names above.
- If you type into a search bar, you MUST include either a "Click Element" or a "Press Enter" step.
- If a selector failed, do NOT hardcode a new one unless you are 100% sure. Set "selector" to null to let the Analyzer re-try discovery.
- Respond ONLY with a JSON object:
{
  "revisedRemainingSteps": [
    { "intent": "Goal", "keyword": "Keyword Name", "args": ["arg1"], "selector": null }
  ],
  "reasoning": "Why"
}
`;

  const userPrompt = `Intent: ${state.input}
Completed Steps: ${JSON.stringify(state.completedSteps)}
Original Remaining Steps: ${JSON.stringify(state.remainingSteps)}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const parsed = extractAndParseJSON(response.content);
  await logger.info(`Reviser: Revised plan with ${parsed.revisedRemainingSteps.length} steps.`);
  await logger.debug(`Reviser Reasoning: ${parsed.reasoning}`);
  
  return {
    remainingSteps: parsed.revisedRemainingSteps,
    retryCount: (state.retryCount || 0) + 1,
    status: 'revising',
    reasoning: parsed.reasoning
  };
};
