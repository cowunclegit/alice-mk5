export const approver = async (state, config) => {
  const logger = config.configurable.logger;

  await logger.info('\n--- PROPOSED EXECUTION PLAN ---');
  state.tasks.forEach(t => {
    const platform = (t.platform || t.tool || 'unknown').replace('_agent', '');
    console.log(`[${t.id}] [${platform.toUpperCase()}] ${t.intent}`);
  });
  console.log('-------------------------------\n');

  await logger.info('Plan automatically approved. Starting execution.');
  return { status: 'executing' };
};
