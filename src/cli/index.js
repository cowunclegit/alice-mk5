import { graph } from '../agents/graph.js';
import { ConfigService } from '../services/config_service.js';
import { GeminiChatModel } from '../agents/models/gemini_model.js';
import { Logger } from '../services/logger.js';
import crypto from 'crypto';

import { StorageService } from '../services/storage_service.js';

const run = async () => {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error('Usage: node src/cli/index.js "your prompt"');
    process.exit(1);
  }

  const config = await ConfigService.load();
  await StorageService.init(config.storage);
  const logger = new Logger(config.logging);
  await logger.init();
  const verbosity = config.logging?.verbosity || 'info';
  const sessionId = crypto.randomBytes(4).toString('hex');

  const model = new GeminiChatModel({ 
    apiKey: config.llm.apiKey,
    modelName: config.llm.model
  });

  const initialState = {
    input: prompt,
    completedSteps: [],
    remainingSteps: [],
    context: { verbosity },
    retryCount: 0,
    status: 'idle',
    sessionId: sessionId,
    plan: [],
    currentStep: null,
    currentHTML: null,
    candidates: [],
    reasoning: ''
  };

  await logger.info(`에이전트를 시작합니다. 프롬프트: "${prompt}"`);
  
  const result = await graph.invoke(initialState, { 
    configurable: { model, logger },
    recursionLimit: 100 // Increased from default 25
  });
  
  await logger.info('실행이 완료되었습니다.');
  await logger.info(`완료된 단계 수: ${result.completedSteps.length}`);
};

run().catch(err => {
  console.error('Agent failed:', err);
  process.exit(1);
});
