import fs from 'fs/promises';
import path from 'path';
import { extractAndParseJSON } from '../../lib/json_utils.js';
import { StorageService } from '../../services/storage_service.js';

export const planner = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Planner: Creating plan using ROLE Snapshot.');

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

  // List available tools
  let availableTools = [];
  try {
    const files = await fs.readdir(StorageService.toolsDir);
    availableTools = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  } catch (e) {
    // ignore
  }

  const snapshot = state.snapshot || "No snapshot available.";

  const systemPrompt = `You are a web automation planner. 
Decompose the user's request into a sequence of robot actions.

${snapshot}

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

### AVAILABLE TOOLS (PRE-VERIFIED SEQUENCES):
${availableTools.join(', ') || 'None'}

### CRITICAL RULES:
1. Use ONLY the exact keyword names defined in the resources above. DO NOT include the resource filename (e.g., "core.resource.") as a prefix.
2. Every step MUST include the exact "keyword" name and its "args" array.
3. Use [ref=eX] identifiers from the PERCEIVED UI STATE for element-based keywords.
   Example: "Click Element" - Args: ["e1"]
4. If an available TOOL exactly matches the user request, you can use the "Run Tool" keyword with the tool name as the first argument.

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
    { role: 'user', content: `Current Task: ${state.input}` }
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
    // Note: completedSteps and context are managed by reducers, 
    // so we only return new values if we want to reset them.
    // In this node, we usually don't want to reset them unless it's a completely new turn.
    status: 'planning',
    reasoning: parsed.reasoning
  };
};
