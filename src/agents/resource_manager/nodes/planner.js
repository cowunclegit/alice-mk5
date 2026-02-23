import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const planner = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info(`ResourceManager Planner: Planning for intent "${state.intent}"`);

  const systemPrompt = `You are a Robot Framework Expert.
Analyze the user's intent and current AXTree to plan a reusable keyword.

### CURRENT AXTree:
${state.axTree ? JSON.stringify(state.axTree, null, 2) : 'No AXTree captured yet.'}

### RULES:
1. **INTENT DETECTION**: Identify if the user wants to ADD, UPDATE, or DELETE a keyword.
2. **CONTEXT-AWARE NAMING**: Use descriptive argument names (e.g., \${search_term}) instead of \${arg1}.
3. **MODULARITY**: Compose a sequence of 1-3 robot steps to fulfill the intent.
4. **SELECTOR SELECTION**: Use the provided 'candidates' list to pick the best selector.

Respond ONLY with a JSON object:
{
  "action": "add | update | delete",
  "keywordName": "Clear Descriptive Name",
  "arguments": ["arg_name_without_dollar"],
  "steps": [
    { "keyword": "Keyword Name", "args": ["selector", "argument_ref"] }
  ],
  "reasoning": "Why this sequence is robust"
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Intent: ${state.intent}
Candidates: ${JSON.stringify(state.candidates)}` }
  ]);

  const parsed = extractAndParseJSON(response.content);

  return {
    draftKeyword: parsed,
    status: 'analyzing',
    reasoning: parsed.reasoning
  };
};
