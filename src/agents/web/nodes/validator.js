import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const validator = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const lastResult = state.context.lastResult;

  const stepsToRecord = state.batch && state.batch.length > 0 ? state.batch : [state.currentStep];

  if (lastResult.status === 'fail') {
    await logger.warn(`Validator: Step failed semantically or technically. ${lastResult.error || ''}`);
    
    const failedSteps = stepsToRecord.map((step, index) => ({
      action: step,
      status: 'fail',
      result: index === stepsToRecord.length - 1 ? lastResult : { status: 'fail' }
    }));

    return { 
      completedSteps: failedSteps,
      retryCount: (state.retryCount || 0) + 1,
      status: 'failed',
      batch: [] // Clear batch on failure too
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

  const newCompletedSteps = stepsToRecord.map((step, index) => ({
    action: step,
    status: parsed.success ? 'pass' : 'fail',
    result: index === stepsToRecord.length - 1 ? lastResult : { status: 'pass' } // Only attach full result to last step
  }));

  return {
    completedSteps: newCompletedSteps,
    currentStep: null,
    batch: [], // Clear batch
    currentHTML: null,
    status: parsed.success ? 'passed' : 'failed'
  };
};
