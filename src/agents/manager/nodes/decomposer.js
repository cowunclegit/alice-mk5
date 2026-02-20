import { extractAndParseJSON } from '../../../lib/json_utils.js';
import fs from 'fs/promises';
import path from 'path';

export const decomposer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Manager: Decomposing user intent into high-level platform tasks.');

  // Read high-level info from core resources
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

  const systemPrompt = `You are a high-level task decomposer for a multi-agent system.
Your job is to assign tasks to the correct platform (web or application).

### PLATFORM GUIDELINES:
- **web**: Use this for ALL tasks involving websites, including searching, clicking, and EXTRACTING/SAVING data from the web to files.
- **application**: Use this ONLY when a specific LOCAL desktop app (e.g., Notepad, Excel, Calculator) needs to be opened or controlled.
- **Summarization/Reporting**: DO NOT create tasks for "Telling the user", "Providing file locations", or "Summarizing results". The Manager handles this automatically at the end.

### KEYWORD REFERENCE:
WEB AGENT: ${webCapabilities}
APP AGENT: ${appCapabilities}

### CRITICAL RULES:
1. If the user says "Search Naver and save results", this is ONE 'web' task.
2. If the user says "Tell me the file location", do NOT create a task. The Manager will see the saved file in the data_store and report it.
3. Respond ONLY with a JSON object:
{
  "tasks": [
    { "id": "T1", "platform": "web | application", "intent": "Cohesive goal (e.g. 'Search Naver news and save to JSON')" }
  ],
  "reasoning": "Explain why you chose this platform"
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
