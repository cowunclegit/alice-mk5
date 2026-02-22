import fs from 'fs/promises';
import path from 'path';
import { extractAndParseJSON } from '../../../lib/json_utils.js';
import { StorageService } from '../../../services/storage_service.js';

export const planner = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Planner: Creating plan using selected resources.');

  const resourceDir = path.join(process.cwd(), 'src/robots/resources');
  let keywordsInfo = "";
  const selectedFiles = state.selectedResources || ["web/core.resource"];

  for (const file of selectedFiles) {
    try {
      const content = await fs.readFile(path.join(resourceDir, file), 'utf8');
      keywordsInfo += `\n--- Resource: ${file} ---\n${content}\n`;
    } catch (e) {}
  }

  const systemPrompt = `You are a high-level web automation architect. 
Decompose the user's request into a STRICT sequence of robot actions.

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

### CRITICAL LOGIC RULES:
1. **TWO-STEP RULE**: If the user wants information, you MUST use at least two steps:
   - Step 1: Navigate/Search to get to the page (e.g., 'Navigate To URL' or 'Search Naver').
   - Step 2: Extract the data (e.g., 'Extract Element Data' or 'Save List Data').
2. **NEVER STOP AT SEARCH**: A 'Search' step alone is NEVER enough to satisfy an information request.
3. **DYNAMIC SELECTORS**: For extraction steps, always set the first argument (selector) to "" (empty string). The Analyzer will find it.
4. **EFFICIENCY**: If a specialized keyword (like 'Get Current Temperature') exists and is verified, use it as a single step.

Respond ONLY with a JSON object:
{
  "plan": [
    { "intent": "Objective of this specific step", "keyword": "Keyword Name", "args": ["arg1", "arg2"] }
  ],
  "reasoning": "Explain how Step 2 will extract the data after Step 1 reaches the page."
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  return {
    plan: parsed.plan,
    remainingSteps: parsed.plan,
    completedSteps: [],
    status: 'planning',
    reasoning: parsed.reasoning
  };
};
