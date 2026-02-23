import { extractAndParseJSON } from '../../../lib/json_utils.js';
import fs from 'fs/promises';
import path from 'path';

export const reviser = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  await logger.info(`Reviser: Attempting to recover from failure. Attempt ${state.retryCount + 1}/5`);

  // Read consolidated resources
  const resourceDir = path.join(process.cwd(), 'src/robots/resources/web');
  let keywordsInfo = "";
  try {
    const files = await fs.readdir(resourceDir);
    for (const file of files) {
      if (file.endsWith('.resource')) {
        const content = await fs.readFile(path.join(resourceDir, file), 'utf8');
        keywordsInfo += `\n--- Resource: ${file} ---\n${content}\n`;
      }
    }
  } catch (e) {
    // ignore
  }

  const systemPrompt = `You are a high-level Web Automation Reviser.
A sequence of robot steps has failed. Your goal is to provide a NEW, alternative execution plan.

### CRITICAL RULES:
1. **NO REPETITION**: DO NOT suggest the same keyword and arguments that just failed.
2. **ALTERNATIVE STRATEGIES**: If a specialized keyword (like 'Extract Naver News Results') failed, try using generic keywords (like 'Save List Data') with different selectors, or try to navigate back/refresh.
3. **SELECTOR DIVERSITY**: If you suspect a selector issue, suggest a different one found in the AXTree history or suggest a broader search.
4. **MAX 3 STEPS**: Keep the revised plan short and focused on immediate recovery.
5. **JSON ONLY**: Respond only with the JSON object.

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

Respond ONLY with a JSON object:
{
  "revisedRemainingSteps": [
    { "intent": "New recovery objective", "keyword": "Keyword Name", "args": ["arg1"] }
  ],
  "reasoning": "Why this new strategy will bypass the previous failure."
}
`;

  const userPrompt = `Intent: ${state.input}
Overall Mission: ${state.originalInput || 'Not specified'}
LATEST FAILED STEP: ${JSON.stringify(state.completedSteps[state.completedSteps.length - 1])}
Completed in current task: ${JSON.stringify(state.completedSteps)}
Completed in previous tasks: ${JSON.stringify(state.pastHistory)}
Current DataStore: ${JSON.stringify(state.dataStore)}
Original Remaining Steps: ${JSON.stringify(state.remainingSteps)}
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
