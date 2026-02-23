import { RobotBridge } from '../../../services/robot_bridge.js';

export const verifier = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.draftKeyword) {
    return { status: 'error', reasoning: 'No draft keyword to verify.' };
  }

  await logger.info(`ResourceManager Verifier: Verifying keyword "${state.draftKeyword.keywordName}"`);

  // Run the sequence of steps defined in the draft keyword
  // Note: For verification, we might need dummy data for arguments
  const dummyDataStore = { ...state.dataStore };
  state.draftKeyword.arguments.forEach(arg => {
    if (!dummyDataStore[arg]) dummyDataStore[arg] = 'test_value';
  });

  const result = await RobotBridge.runSequence(
    state.draftKeyword.steps,
    'VERIFY',
    state.sessionId,
    ['web/core.resource'],
    logger,
    dummyDataStore
  );

  if (result.status === 'pass') {
    await logger.info(`ResourceManager Verifier: Keyword verified successfully!`);
    return {
      status: 'saving',
      history: [...(state.history || []), { type: 'verification', status: 'pass', result }]
    };
  } else {
    const retries = (state.retryCount || 0) + 1;
    await logger.warn(`ResourceManager Verifier: Verification failed. Attempt ${retries}/3. Error: ${result.stderr}`);
    
    if (retries >= 3) {
      return {
        status: 'error',
        reasoning: `Verification failed after 3 attempts: ${result.stderr}`,
        history: [...(state.history || []), { type: 'verification', status: 'fail', result }]
      };
    }

    return {
      status: 'analyzing', // Go back to planner for self-healing
      retryCount: retries,
      history: [...(state.history || []), { type: 'verification', status: 'fail', result }]
    };
  }
};
