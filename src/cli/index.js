import { graph } from '../agents/graph.js';
import { ConfigService } from '../services/config_service.js';
import { GeminiChatModel } from '../agents/models/gemini_model.js';

const run = async () => {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error('Usage: node src/cli/index.js "your prompt"');
    process.exit(1);
  }

  const config = await ConfigService.load();
  const verbosity = config.logging?.verbosity || 'info';

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
    status: 'idle'
  };

  console.log(`에이전트를 시작합니다. 프롬프트: "${prompt}"`);
  
  const result = await graph.invoke(initialState, { configurable: { model } });
  
  console.log('실행이 완료되었습니다.');
  console.log('완료된 단계 수:', result.completedSteps.length);
};

run().catch(err => {
  console.error('Agent failed:', err);
  process.exit(1);
});
