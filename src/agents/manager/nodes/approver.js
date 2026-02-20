import readline from 'readline/promises';

export const approver = async (state, config) => {
  const logger = config.configurable.logger;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await logger.info('\n--- PROPOSED EXECUTION PLAN ---');
  state.tasks.forEach(t => {
    const platform = (t.platform || t.tool || 'unknown').replace('_agent', '');
    console.log(`[${t.id}] [${platform.toUpperCase()}] ${t.intent}`);
  });
  console.log('-------------------------------\n');

  const answer = await rl.question('Do you approve this plan? (y/n): ');
  rl.close();

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    await logger.info('Plan approved. Starting execution.');
    return { status: 'executing' };
  } else {
    await logger.error('Plan rejected by user.');
    return { status: 'error', reasoning: 'User rejected the plan.' };
  }
};
