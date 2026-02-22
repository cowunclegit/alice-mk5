import fs from 'fs/promises';
import path from 'path';
import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const planner = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info(`Planner: Creating plan for input: "${state.input}"`);

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

### PREVIOUSLY COLLECTED DATA (dataStore):
${JSON.stringify(state.dataStore || {}, null, 2)}

### CRITICAL LOGIC RULES:
1. **TWO-STEP RULE**: If the user wants information, you MUST use at least two steps:
   - Step 1: Navigate/Search to get to the page (e.g., 'Navigate To URL' or 'Search Naver').
   - Step 2: Extract the data (e.g., 'Extract Element Data' or 'Save List Data').
2. **NEVER STOP AT SEARCH**: A 'Search' step alone is NEVER enough to satisfy an information request.
3. **DYNAMIC SELECTORS**: For extraction steps, always set the first argument (selector) to "" (empty string). The Analyzer will find it.
4. **NO HALLUCINATED URLS**: NEVER use placeholder URLs like 'example.com'. Only navigate to URLs found in 'AVAILABLE ROBOT RESOURCES' or those extracted into the dataStore from previous steps.
5. **DATA FLOW**: To use data from a previous task, reference the key in the dataStore using the format '{{key.path}}'. For example, '{{result.data.0.link}}'.
6. **STRICT LITERALS**: DO NOT substitute or change literal values (search terms, names, dates) provided in the user request. Use them EXACTLY as given.
7. **CONTEXTUAL CONSISTENCY**: Maintain consistency with the overall mission and the current page state. Do not navigate to a new platform if the required information is likely available on the current one.

Respond ONLY with a JSON object:
{
  "plan": [
    { "intent": "Objective of this specific step", "keyword": "Keyword Name", "args": ["arg1", "arg2"] }
  ],
  "reasoning": "Explain how Step 2 will extract the data after Step 1 reaches the page."
}
`;

  const userContent = `Overall Mission: ${state.originalInput || 'Not specified'}
Current Task: ${state.input}`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  await logger.info(`Planner: Established plan:\n${JSON.stringify(parsed.plan, null, 2)}`);
  
  return {
    plan: parsed.plan,
    remainingSteps: parsed.plan,
    completedSteps: [],
    status: 'planning',
    reasoning: parsed.reasoning
  };
};
