import { extractAndParseJSON } from '../../lib/json_utils.js';

export const router = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  // If tasks already exist, this is a routing decision, not decomposition
  if (state.tasks && state.tasks.length > 0) {
    return { status: 'routing' };
  }

  await logger.info('Manager: Decomposing intent into platform-specific tasks.');

  const systemPrompt = `You are a task decomposer for a multi-platform automation agent.
Analyze the user intent and split it into a sequence of tasks grouped by platform.

### RULES:
- Use "web" for website interactions.
- Use "application" for desktop app interactions.
- CRITICAL: Group consecutive actions on the SAME platform into a single task.
  - Example: "Search Naver, click news, and save titles" -> ONE "web" task.
  - Example: "Search Naver, then copy to Notepad" -> TWO tasks: 1 "web", 2 "application".
- Respond ONLY with a JSON object:
{
  "tasks": [
    { "platform": "web | application", "intent": "Full task description for this platform" }
  ],
  "reasoning": "Why"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.input }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  return {
    tasks: parsed.tasks,
    currentTaskIndex: 0,
    status: 'routing',
    reasoning: parsed.reasoning
  };
};
