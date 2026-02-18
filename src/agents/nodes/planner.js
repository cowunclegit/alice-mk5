import fs from 'fs/promises';
import path from 'path';
import { extractAndParseJSON } from '../../lib/json_utils.js';
import { StorageService } from '../../services/storage_service.js';

export const planner = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Planner: Creating plan using selected resources.');

  // Read only selected resources
  const resourceDir = path.join(process.cwd(), 'src/robots/resources');
  let keywordsInfo = "";
  const selectedFiles = state.selectedResources || ["core.resource"];

  for (const file of selectedFiles) {
    try {
      const content = await fs.readFile(path.join(resourceDir, file), 'utf8');
      keywordsInfo += `\n--- Resource: ${file} ---\n${content}\n`;
    } catch (e) {
      await logger.error(`Planner: Failed to read resource ${file}: ${e.message}`);
    }
  }

  // List available tools to the planner
  let availableTools = [];
  try {
    const files = await fs.readdir(StorageService.toolsDir);
    availableTools = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  } catch (e) {
    // ignore
  }

  const systemPrompt = `You are a web automation planner. 
Decompose the user's request into a sequence of robot actions.

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

### AVAILABLE TOOLS (PRE-VERIFIED SEQUENCES):
${availableTools.join(', ') || 'None'}

### CRITICAL RULES:
1. Use ONLY the keywords defined in the resources above.
2. Every step MUST include the exact "keyword" name and its "args" array.
3. If an available TOOL exactly matches the user request, you can use the "Run Tool" keyword with the tool name as the first argument.

Respond ONLY with a JSON object:
{
  "plan": [
    { "intent": "Goal", "keyword": "Exact Keyword Name", "args": ["val1"] }
  ],
  "reasoning": "Why"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  const expandedPlan = [];
  for (const step of parsed.plan) {
    if (step.keyword === 'Run Tool') {
      const toolId = step.args[0];
      const sequence = await StorageService.loadSequence(toolId);
      expandedPlan.push(...sequence.actions);
    } else {
      expandedPlan.push(step);
    }
  }

  return {
    plan: expandedPlan,
    remainingSteps: expandedPlan,
    completedSteps: [],
    context: {},
    status: 'planning',
    reasoning: parsed.reasoning
  };
};
