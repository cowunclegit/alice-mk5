import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const validator = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const lastResult = state.context.lastResult;

  if (lastResult.status === 'fail') {
    await logger.warn(`Validator: Step failed semantically or technically. ${lastResult.error || ''}`);
    
    return { 
      completedSteps: { action: state.currentStep, status: 'fail', result: lastResult },
      retryCount: (state.retryCount || 0) + 1,
      status: 'failed'
    };
  }

  // LLM-based semantic validation
  await logger.info('Validator: Performing semantic validation with LLM.');
  const systemPrompt = `You are a Web Action Validator.
Did the action successfully achieve its intent based on the execution logs?

Action Intent: ${state.currentStep.intent}
Robot Execution Result: ${JSON.stringify(lastResult)}

Respond ONLY with a JSON object: { "success": true/false, "reasoning": "Detailed explanation of why it succeeded or failed." }`;

  const response = await model.invoke([{ role: 'system', content: systemPrompt }]);
  const parsed = extractAndParseJSON(response.content);
  
  await logger.info(`Validator: Semantic check result: ${parsed.success ? 'PASS' : 'FAIL'} - ${parsed.reasoning}`);

  return {
    completedSteps: { action: state.currentStep, status: parsed.success ? 'pass' : 'fail', result: lastResult },
    currentStep: null, // Clear for next step
    currentHTML: null, // Clear cache
    status: parsed.success ? 'passed' : 'failed'
  };
};
