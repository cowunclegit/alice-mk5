import { StorageService } from '../../services/storage_service.js';
import fs from 'fs/promises';

export const planner = async (state, config) => {
  const input = state.input.toLowerCase();
  
  // Direct tool execution (Legacy/Short-cut)
  if ((input.startsWith('run tool ') || input.startsWith('use tool ')) && !input.includes(' and ')) {
    const toolId = input.replace('run tool ', '').replace('use tool ', '').trim();
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

  const systemPrompt = `You are a web automation planner. 
Decompose the user's request into a sequence of robot actions.
Available keywords: Open Visible Browser, Navigate To URL, Wait For Element, Interact With Element, Capture DOM Source.
Available Tools: ${availableTools.join(', ') || 'None'}

If a tool matches part of the request, use the keyword "Run Tool" with the tool name as the first argument.

Respond ONLY with a JSON object in the following format:
{
  "plan": [
    { "intent": "Description", "keyword": "Keyword Name", "args": ["arg1"], "selector": "optional" }
  ],
  "reasoning": "Explanation"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = JSON.parse(response.content);
  
  // Expand "Run Tool" steps
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
    status: 'planning',
    reasoning: parsed.reasoning
  };
};
