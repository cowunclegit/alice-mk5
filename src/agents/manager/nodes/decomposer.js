import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const decomposer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  // Determine if this is a replan
  const isReplanning = state.status === 'replanning';
  const replanCount = state.replanCount || 0;

  if (isReplanning && replanCount > 5) {
    return {
      status: 'error',
      reasoning: 'Maximum replan attempts (5) exceeded. Aborting mission.'
    };
  }

  await logger.info(isReplanning 
    ? `Manager: Re-planning mission (Attempt ${replanCount + 1})...` 
    : 'Manager: Analyzing intent and creating execution plan...');

  const systemPrompt = `You are a strategic Web Automation Architect.
Your goal is to create a sequential execution plan to fulfill the user's request.

### CAPABILITIES:
1. **Web Agent**: Can navigate, search, extract data, and click elements using visual analysis (AXTree).
2. **Filesystem Agent**: Can read/write files.
3. **Application Agent**: Can control desktop apps (optional).

### REPLANNING CONTEXT:
${isReplanning ? `Previous plan failed. History: ${JSON.stringify(state.history.slice(-3))}` : "Initial planning phase."}

### RULES:
1. **Direct Answer**: If the request is simple (e.g. "Hi", "Summary of X"), answer directly without tools.
2. **Sequential Steps**: Break complex tasks into logical, sequential steps.
3. **Tool Usage**: Assign 'web_agent' for any internet task.
4. **Outcome**: Ensure the last step gathers the final answer.

Respond ONLY with a JSON object:
{
  "tasks": [
    { 
      "id": "T1", 
      "tool": "web_agent | filesystem_agent | application_agent", 
      "intent": "Clear natural language description of what this agent should do." 
    }
  ],
  "direct_answer": "Optional string if no tools are needed",
  "reasoning": "Why this plan is efficient"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = extractAndParseJSON(response.content);

  // Direct answer path (US1)
  if (parsed.direct_answer) {
    return {
      status: 'finished',
      final_response: parsed.direct_answer,
      reasoning: parsed.reasoning
    };
  }

  return {
    tasks: parsed.tasks,
    status: 'planning',
    replanCount: isReplanning ? replanCount + 1 : 0,
    reasoning: parsed.reasoning
  };
};
