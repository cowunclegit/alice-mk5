import { extractAndParseJSON } from '../../../lib/json_utils.js';
import fs from 'fs/promises';
import path from 'path';
import { StorageService } from '../../../services/storage_service.js';

export const decomposer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Manager: Decomposing user intent and checking for available tools.');

  // 1. Read high-level info from core resources
  let webCapabilities = "";
  let appCapabilities = "";
  try {
    const webCore = await fs.readFile(path.join(process.cwd(), 'src/robots/resources/web/core.resource'), 'utf8');
    webCapabilities = webCore.split('*** Keywords ***')[1] || "";
  } catch (e) {}
  try {
    const appCore = await fs.readFile(path.join(process.cwd(), 'src/robots/resources/application/core.resource'), 'utf8');
    appCapabilities = appCore.split('*** Keywords ***')[1] || "";
  } catch (e) {}

  // 2. Read available TOOLS
  let availableTools = [];
  try {
    const webToolsDir = path.join(StorageService.toolsDir, 'web');
    const files = await fs.readdir(webToolsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(webToolsDir, file), 'utf8');
        const tool = JSON.parse(content);
        availableTools.push({
          id: tool.id,
          title: tool.title,
          description: tool.description,
          variables: tool.variables
        });
      }
    }
  } catch (e) {}

  const systemPrompt = `You are a high-level strategic orchestrator for a multi-agent system.
Your job is to break the user's intent into a few COHESIVE, HIGH-LEVEL tasks.

### AVAILABLE TOOLS (PRIORITIZE THESE):
${JSON.stringify(availableTools, null, 2)}

### SUB-AGENT CAPABILITIES:
- web: ${webCapabilities.slice(0, 300)}...
- application: ${appCapabilities.slice(0, 300)}...

### CRITICAL RULES:
1. USE EXISTING TOOLS: If a tool like 'hanroro' matches the goal, use it as a single task. 
   - Intent format for tools: "Use tool '[tool_id]' with [variable]='[value]'"
2. DO NOT MICROMANAGE: Do not break web tasks into "Open Browser", "Click", "Type". 
   - Good Web Intent: "Search Naver for 'X', extract news results, and save them to a file."
   - Bad Web Intent: "Step 1: Open browser. Step 2: Type X..."
3. ONE TASK PER PLATFORM SHIFT: If the user wants to search Web and then write to Notepad, create ONE 'web' task and ONE 'application' task.
4. Respond ONLY with a JSON object:
{
  "tasks": [
    { "id": "T1", "platform": "web | application", "intent": "A high-level goal that the sub-agent's internal planner can understand" }
  ],
  "reasoning": "Why you chose this high-level split"
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
