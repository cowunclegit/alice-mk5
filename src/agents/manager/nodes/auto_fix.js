import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const autoFix = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const currentTask = state.tasks[state.currentTaskIndex];

  if (!currentTask) {
    await logger.error(`AutoFix: No task found at index ${state.currentTaskIndex}.`);
    return { status: 'failed' };
  }

  const retryCount = state.retryCounts[currentTask.id] || 0;

  if (retryCount >= 3) {
    await logger.error(`AutoFix: Max retries (3) reached for task ${currentTask.id}. Giving up.`);
    return { status: 'failed' };
  }

  await logger.info(`AutoFix: Attempting to recover from failure in task ${currentTask.id} (Attempt ${retryCount + 1}/3).`);

  const systemPrompt = `You are a multi-agent error recovery assistant.
A sub-agent task has failed. Analyze the error and original intent to provide a REVISED sub-intent for the same platform.

### RULES:
- Keep the same platform: ${currentTask.platform || currentTask.tool}.
- Suggest a slightly different approach or more detailed sub-intent to bypass the failure.
- Respond ONLY with a JSON object:
{
  "revisedIntent": "New detailed intent",
  "reasoning": "Why this might work"
}
`;

  const userPrompt = `Failed Task ID: ${currentTask.id}
Failed Task Intent: ${currentTask.intent}
Failure Reasoning: ${state.reasoning}
Shared Context Data: ${JSON.stringify(state.dataStore)}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  const updatedTasks = [...state.tasks];
  updatedTasks[state.currentTaskIndex] = {
    ...currentTask,
    intent: parsed.revisedIntent
  };

  return {
    tasks: updatedTasks,
    retryCounts: { [currentTask.id]: retryCount + 1 },
    status: 'executing', // Go back to executor
    reasoning: parsed.reasoning
  };
};
