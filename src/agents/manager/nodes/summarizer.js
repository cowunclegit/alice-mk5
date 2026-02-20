export const summarizer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Manager: Generating final summary from unified result store.');

  const systemPrompt = `You are a multi-agent orchestration summarizer.
Your goal is to provide a final answer by analyzing the 'data_store'.

### DATA STORE STRUCTURE:
The data_store contains entries. Some are files, some are raw values.
- Entries with "type: 'file'" have a "path" and sometimes "data" (if JSON).
- Always tell the user the EXACT "path" of any saved files.

### RULES:
- If the user asked for a summary or specific items, use the "data" field inside file entries.
- Clearly list all generated files and their locations.
- Respond in the same language as the user's input.
`;

  const userPrompt = `Original Intent: ${state.input}
Unified Data Store: ${JSON.stringify(state.dataStore)}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  console.log('\n==================================================');
  console.log('🤖 AGENT FINAL RESPONSE:');
  console.log(response.content);
  console.log('==================================================\n');

  return {
    reasoning: response.content,
    status: 'finished'
  };
};
