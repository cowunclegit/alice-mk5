import fs from 'fs/promises';
import path from 'path';
import { extractAndParseJSON } from '../../../lib/json_utils.js';
import { AppiumService } from '../../../services/appium/index.js';
import { StorageService } from '../../../services/storage_service.js';

export const planner = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('AppPlanner: Creating execution plan.');

  // Read Appium resources
  const resourceDir = path.join(process.cwd(), 'src/robots/resources/application');
  let keywordsInfo = "";
  try {
    const content = await fs.readFile(path.join(resourceDir, 'core.resource'), 'utf8');
    keywordsInfo = `
--- Resource: core.resource ---
${content}
`;
  } catch (e) {}

  // List available application tools
  const availableTools = await StorageService.listTools('application');

  const appiumUrl = await AppiumService.getServerUrl();
  const caps = state.appCapabilities;

  if (!caps) {
    await logger.error('AppPlanner: Missing appCapabilities. Aborting.');
    return { status: 'error', reasoning: 'Missing application capabilities.' };
  }

  const systemPrompt = `You are a desktop application automation planner.
Decompose the intent into a sequence of Robot Framework actions using AppiumLibrary.

### AVAILABLE ROBOT RESOURCES:
${keywordsInfo}

### AVAILABLE TOOLS (PRE-VERIFIED SEQUENCES):
${availableTools.join(', ') || 'None'}

### TARGET APP INFO:
- App: ${caps.app}
- Platform: ${caps.platformName}

### AVAILABLE DATA (FROM PREVIOUS STEPS):
${JSON.stringify(state.dataStore || {})}

### CRITICAL RULES:
1. The FIRST step MUST be "Open Application Session" with args: ["${appiumUrl}", "${caps.platformName}", "${caps.app}", "${caps.automationName}", "${caps.deviceName}"]
2. Every subsequent step MUST use keywords from the resources.
3. Every step MUST include exact "keyword" and its "args" array.
4. If you need to click/type, set "selector" to null (Analyzer will find it).
5. If an available TOOL exactly matches the user request, you can use the "Run Tool" keyword with the tool name as the first argument.

Respond ONLY with a JSON object:
{
  "plan": [
    { "intent": "Goal", "keyword": "Keyword Name", "args": ["arg1"], "selector": null }
  ],
  "reasoning": "Why"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.intent }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  const expandedPlan = [];
  for (const step of parsed.plan) {
    if (step.keyword === 'Run Tool') {
      const toolId = step.args[0];
      const sequence = await StorageService.loadSequence(toolId, 'application');
      expandedPlan.push(...sequence.actions);
    } else {
      expandedPlan.push(step);
    }
  }

  return {
    plan: expandedPlan,
    remainingSteps: expandedPlan,
    completedSteps: [],
    status: 'planning',
    reasoning: parsed.reasoning
  };
};
