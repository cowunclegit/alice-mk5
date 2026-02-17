import { extractAndParseJSON } from '../../lib/json_utils.js';
import fs from 'fs/promises';
import path from 'path';

export const reviser = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  await logger.info(`Reviser: Attempting to recover from failure. Attempt ${state.retryCount + 1}/5`);

  // Read consolidated resources
  const resourceDir = path.join(process.cwd(), 'src/robots/resources');
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

  const systemPrompt = `You are a web automation reviser.
A step has failed. Analyze history and original intent to fix the REMAINING plan.

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

### RULES:
- Use ONLY the keywords defined in the resources.
- Respond ONLY with a JSON object:
{
  "revisedRemainingSteps": [
    { "intent": "Goal", "keyword": "Keyword Name", "args": ["arg1"] }
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
  
  return {
    remainingSteps: parsed.revisedRemainingSteps,
    retryCount: (state.retryCount || 0) + 1,
    status: 'revising',
    reasoning: parsed.reasoning
  };
};
