import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const decomposer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Manager: Planning tasks using available agents as tools.');

  const systemPrompt = `You are a strategic orchestrator. 
Decompose the user's request into high-level tasks that can be fulfilled by the following AGENT TOOLS.

### AVAILABLE AGENT TOOLS:
1. web_agent: For any website interactions, searching, scraping, and navigation.
2. filesystem_agent: For reading/writing local files and managing data persistence.
3. application_agent: For any local desktop software interactions (Notepad, Calculator, etc).

### RULES:
1. Break complex requests into sequential steps.
2. Assign each step to the correct AGENT TOOL.
   - Use 'web' for 'web_agent'
   - Use 'filesystem' for 'filesystem_agent': Managing file persistence and extracting specific variables for the shared 'dataStore'.
   - Use 'application' for 'application_agent': Interacting with local GUI software.
3. DATA DEPENDENCY: 
   - Ensure data required for a step is explicitly extracted or prepared by a preceding step.
   - Use 'filesystem_agent' to bridge data between tools if one tool's output needs to be parsed for another tool's input.
   - Reference keys in the 'dataStore' explicitly in the intent (e.g., "Use the 'key_name' from dataStore").
4. TOOL INTENT: Provide a cohesive and goal-oriented intent for each tool, focusing on the expected outcome.
5. Respond ONLY with a JSON object:
{
  "tasks": [
    { "id": "T1", "platform": "web | filesystem | application", "tool": "web_agent | filesystem_agent | application_agent", "intent": "Objective for the tool. Reference dataStore keys if necessary." }
  ],
  "reasoning": "Orchestration strategy"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  return {
    tasks: parsed.tasks,
    reasoning: parsed.reasoning,
    status: 'planning'
  };
};
