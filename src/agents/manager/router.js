import { extractAndParseJSON } from '../../lib/json_utils.js';

/**
 * Router node to classify user intent at the entry point.
 * Branches between 'automation' (standard tasks) and 'resource_management' (modifying robots).
 */
export const router = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Manager: Routing user intent...');

  const systemPrompt = `You are a strategic router for a multi-agent automation system.
Your job is to determine if the user wants to perform an automation task or manage the underlying Robot Framework resources (keywords, files).

### INTENT CATEGORIES:
1. "automation": Standard requests to DO something (e.g., "Search Naver", "Open Notepad", "Extract news").
2. "resource_management": Requests to ADD, MODIFY, or CREATE Robot Framework keywords or resource files (e.g., "Add a keyword to Naver resource", "Modify the login keyword", "Create a new resource file for Slack").

### RULES:
- If the user asks to "fix" or "update" a specific automation keyword, it is "resource_management".
- If the user asks to "perform" or "run" a sequence, it is "automation".
- Respond ONLY with a JSON object:
{
  "category": "automation | resource_management",
  "reasoning": "Brief explanation"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  await logger.info(`Manager: Intent classified as "${parsed.category}"`);

  return {
    status: parsed.category === 'resource_management' ? 'resource_management' : 'planning',
    reasoning: parsed.reasoning
  };
};
