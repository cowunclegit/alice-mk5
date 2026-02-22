export const summarizer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  if (state.status === 'replanning') {
    return { status: 'replanning' }; // Pass through to decomposer
  }

  await logger.info('Manager: Synthesizing final mission summary.');

  const systemPrompt = `You are a Mission Reporter.
Summarize the results of the executed plan for the user.

### ORIGINAL REQUEST:
"${state.input}"

### EXECUTION HISTORY:
${JSON.stringify(state.history)}

### DATA COLLECTED:
${JSON.stringify(state.dataStore)}

### INSTRUCTIONS:
1. Be concise and direct.
2. If data was collected (e.g. prices, weather), explicitly state the values.
3. If files were created, provide their paths.
4. If the mission failed, explain why based on the history.
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt }
  ]);

  console.log('\n==================================================');
  console.log('🤖 MISSION COMPLETE REPORT');
  console.log(response.content);
  console.log('==================================================\n');

  return {
    status: 'finished'
  };
};
