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

### VIRTUAL KEYWORDS (LLM-DIRECT):
- **Analyze Data**: Use this if the task is to analyze, filter, or process information ALREADY present in the dataStore.
- **Summarize Results**: Use this to create a final summary or answer based on collected data.
- **Read Local Data**: Use this if the task is to "read" or "extract" from data already in context.

### PREVIOUSLY COLLECTED DATA (dataStore):
${JSON.stringify(state.dataStore || {}, null, 2)}

### PREVIOUSLY COMPLETED STEPS (IN THIS MISSION):
${JSON.stringify((state.pastHistory || []).map(s => s.action.intent) || [], null, 2)}

### CRITICAL LOGIC RULES:
1. **ONLY PLAN FOR CURRENT TASK**: The Current Task is part of a larger mission. DO NOT re-plan steps that have already been completed (see history above).
2. **COGNITIVE TASKS**: If the task is about reading, summarizing, or analyzing data already in the dataStore, use a **VIRTUAL KEYWORD**. DO NOT use 'No Operation'.
3. **CONTEXTUAL START**: Assume the browser is already at the location reached by previous steps. Only navigate if the Current Task requires a DIFFERENT platform or URL.
4. **TWO-STEP RULE**: If the task requires information extraction:
   - Step 1: Navigate/Search to the specific section (if not already there).
   - Step 2: Extract the data.
5. **DYNAMIC SELECTORS**: For extraction steps (like 'Save List Data' or 'Extract Element Data'), if you don't know the selector, set the first argument to "". The Analyzer will find it.
6. **DATA FLOW**: Use '{{key.path}}' to reference results in the dataStore.
7. **STRICT LITERALS**: Use terms EXACTLY as provided in the user request.

Respond ONLY with a JSON object:
{
  "plan": [
    { "intent": "Objective of this specific step", "keyword": "Keyword Name", "args": ["arg1", "arg2"] }
  ],
  "reasoning": "Explain why this plan is the minimal delta needed to achieve the Current Task."
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
