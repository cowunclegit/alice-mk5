export const validator = async (state, config) => {
  const model = config.configurable.model;
  const lastResult = state.context.lastResult;
  const completed = state.completedSteps || [];

  const systemPrompt = `You are a web automation validator.
Given the original user intent, the action performed, and the execution result, determine if the goal was met.
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

  const parsed = JSON.parse(response.content);
  
  const stepResult = {
    action: state.currentStep,
    result: lastResult,
    status: parsed.success ? 'pass' : 'fail',
    reasoning: parsed.reasoning
  };

  return {
    completedSteps: [...completed, stepResult],
    currentStep: null,
    status: 'validating'
  };
};
