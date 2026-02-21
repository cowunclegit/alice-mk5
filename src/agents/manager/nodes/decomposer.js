import { extractAndParseJSON } from '../../../lib/json_utils.js';
import fs from 'fs/promises';
import { StorageService } from '../../../services/storage_service.js';

export const decomposer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Manager: Planning tasks using available agents and specialized tools.');

  // 1. Read available TOOLS from catalog
  let availableTools = [];
  try {
    const content = await fs.readFile(StorageService.catalogPath, 'utf8');
    const catalog = JSON.parse(content);
    availableTools = catalog.tools || [];
  } catch (e) {
    await logger.warn('Decomposer: Could not read tool catalog.');
  }

  const systemPrompt = `You are a strategic orchestrator. 
Decompose the user's request into high-level tasks that can be fulfilled by the following AGENT TOOLS or SPECIALIZED TOOLS.

### AVAILABLE AGENT TOOLS:
1. web_agent: For any website interactions, searching, scraping, and navigation.
2. filesystem_agent: For reading/writing local files and managing data persistence.
3. application_agent: For any local desktop software interactions (Notepad, Calculator, etc).

### AVAILABLE SPECIALIZED TOOLS (PRE-VERIFIED SEQUENCES):
${availableTools.length > 0 ? JSON.stringify(availableTools, null, 2) : 'None'}

### RULES:
1. PRIORITIZE SPECIALIZED TOOLS: If a specialized tool exists that matches part of the request, USE IT as a single task.
   - For specialized tools, set 'tool' to 'specialized_tool' and include 'toolId' in the task object.
2. Break complex requests into sequential steps.
3. Assign each step to the correct AGENT TOOL.
   - Use 'web' for 'web_agent'
   - Use 'filesystem' for 'filesystem_agent': Managing file persistence and extracting specific variables for the shared 'dataStore'.
   - Use 'application' for 'application_agent': Interacting with local GUI software.
4. DATA DEPENDENCY: 
   - Ensure data required for a step is explicitly extracted or prepared by a preceding step.
   - Reference keys in the 'dataStore' explicitly in the intent.
5. Respond ONLY with a JSON object:
{
  "tasks": [
    { 
      "id": "T1", 
      "platform": "web | filesystem | application", 
      "tool": "web_agent | filesystem_agent | application_agent | specialized_tool",
      "toolId": "id_of_specialized_tool (if applicable)",
      "intent": "Objective for the tool. Reference dataStore keys if necessary." 
    }
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
