import { extractAndParseJSON } from '../../lib/json_utils.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Revises the remaining steps based on the latest ROLE Snapshot and previous failures.
 * @param {Object} state 
 * @param {Object} config 
 * @returns {Object} Updated state
 */
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

  const snapshot = state.snapshot || "No snapshot available.";

  const systemPrompt = `You are a web automation reviser.
A step has failed. Analyze the ROLE Snapshot and history to fix the REMAINING plan.

${snapshot}

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

### CRITICAL RULES:
1. Use ONLY the keywords defined in the resources above.
2. Every step MUST include the exact "keyword" name and its "args" array.
3. Use [ref=eX] identifiers from the PERCEIVED UI STATE for element-based keywords.
4. Correct any mistakes that led to previous failures in the history.

Respond ONLY with a JSON object:
{
  "revisedRemainingSteps": [
    { "intent": "Goal", "keyword": "Keyword Name", "args": ["arg1"] }
  ],
  "reasoning": "Why"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: "Revise the plan." }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  return {
    remainingSteps: parsed.revisedRemainingSteps,
    retryCount: (state.retryCount || 0) + 1,
    status: 'revising',
    reasoning: parsed.reasoning
  };
};
