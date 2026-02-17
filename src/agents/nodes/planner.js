import { StorageService } from '../../services/storage_service.js';
import fs from 'fs/promises';
import { extractAndParseJSON } from '../../lib/json_utils.js';

export const planner = async (state, config) => {
  const logger = config.configurable.logger;
  const input = state.input.toLowerCase();
  
  await logger.debug(`Planner: Analyzing input: ${state.input}`);
  
  // Direct tool execution (Legacy/Short-cut)
  if ((input.startsWith('run tool ') || input.startsWith('use tool ')) && !input.includes(' and ')) {
    const toolId = input.replace('run tool ', '').replace('use tool ', '').trim();
    await logger.info(`Planner: Direct tool execution detected for: ${toolId}`);
    const sequence = await StorageService.loadSequence(toolId);
    return {
      plan: sequence.actions,
      remainingSteps: sequence.actions,
      status: 'planning',
      reasoning: `Loading saved tool: ${toolId}`
    };
  }

  const model = config.configurable.model;
  
  // List available tools to the planner
  const toolsDir = './src/memory/sequences';
  let availableTools = [];
  try {
    const files = await fs.readdir(toolsDir);
    availableTools = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  } catch (e) {
    // ignore
  }

  await logger.debug(`Planner: Available tools: ${availableTools.join(', ')}`);

  const systemPrompt = `You are a web automation planner. 
Decompose the user's request into a sequence of robot actions.

### Available Keywords and Argument Rules:
1. "Open Visible Browser" - Args: ["URL"] (URL MUST include protocol like https://)
2. "Navigate To URL" - Args: ["URL"] (URL MUST include protocol like https://)
3. "Wait For Element" - Intent: "What to wait for", Selector: null (Analyzer will find it)
4. "Click Element" - Intent: "What to click", Args: [], Selector: null (Analyzer will find it)
5. "Type Into Element" - Intent: "What to type into", Args: ["Text to type"], Selector: null (Analyzer will find it)
6. "Capture DOM Source" - No args.
7. "Extract Element Data" - Intent: "What to extract", Selector: null.

### CRITICAL RULES:
- Use ONLY the keyword names listed above. NO OTHER KEYWORDS.
- For Click/Type/Wait/Extract, set "selector" to null. The Analyzer will resolve it.
- Do NOT include the selector in the "args" array.
- Respond ONLY with a JSON object in the format:
{
  "plan": [
    { "intent": "Semantic goal", "keyword": "Keyword Name", "args": ["arg1"], "selector": null }
  ],
  "reasoning": "Brief explanation"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = extractAndParseJSON(response.content);
  await logger.info(`Planner: Plan generated with ${parsed.plan.length} steps.`);
  await logger.debug(`Planner Reasoning: ${parsed.reasoning}`);
  
  const sanitizedPlan = parsed.plan.map(step => ({
    ...step,
    args: Array.isArray(step.args) ? step.args : []
  }));

  // Expand "Run Tool" steps
  const expandedPlan = [];
  for (const step of sanitizedPlan) {
    if (step.keyword === 'Run Tool') {
      const toolId = step.args[0];
      await logger.debug(`Planner: Expanding tool: ${toolId}`);
      const sequence = await StorageService.loadSequence(toolId);
      expandedPlan.push(...sequence.actions);
    } else {
      expandedPlan.push(step);
    }
  }
  
  return {
    plan: expandedPlan,
    remainingSteps: expandedPlan,
    status: 'planning',
    reasoning: parsed.reasoning
  };
};
