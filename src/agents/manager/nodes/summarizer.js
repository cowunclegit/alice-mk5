export const summarizer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  await logger.info('Manager: Synthesizing final response from execution context.');

  const systemPrompt = `You are a cognitive orchestration summarizer for an AI automation agent.
Your primary role is to satisfy the User's original intent by synthesizing the results gathered by sub-agents.

### CONTEXT:
The 'Unified Data Store' contains the ground truth results from automated actions (Web scraping, App control, Tool execution).
The work is ALREADY COMPLETE. Your task is to report the outcomes and answer any questions based on this data.

### DATA INTERPRETATION RULES:
1. SENSE-MAKING: Analyze the 'Unified Data Store' to find relevant information that directly addresses the user's prompt.
2. FILE REPORTING: If files (JSON, CSV, PNG, etc.) were generated, identify their purposes and provide their absolute paths clearly.
3. DATA SYNTHESIS: If the user asked for analysis (summarization, selection, comparison), perform this reasoning based ONLY on the data in the store.
4. HONESTY: If the required data is truly missing from the store, explain what part of the plan might have failed based on the data provided.

### RESPONSE GUIDELINES:
- Provide a natural, professional response in the same language as the user's input.
- Focus on the VALUE delivered to the user.
`;

  const userPrompt = `[User Original Intent]: "${state.input}"
[Execution Status]: ${state.status}
[Execution Reasoning]: ${state.reasoning || 'N/A'}
[Unified Data Store]: ${JSON.stringify(state.dataStore)}
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
