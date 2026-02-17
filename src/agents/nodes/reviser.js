export const reviser = async (state, config) => {
  const model = config.configurable.model;
  
  const systemPrompt = `You are a web automation reviser.
A step in the plan has failed. Analyze the completed steps and the original intent, and revise the REMAINING steps to achieve the goal.
Respond ONLY with a JSON object in the format:
{
  "revisedRemainingSteps": [
    { "intent": "Description", "keyword": "Keyword Name", "args": ["arg1"], "selector": "optional" }
  ],
  "reasoning": "Brief explanation of why the change was made"
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

  const parsed = JSON.parse(response.content);
  
  return {
    remainingSteps: parsed.revisedRemainingSteps,
    retryCount: (state.retryCount || 0) + 1,
    status: 'revising',
    reasoning: parsed.reasoning
  };
};
