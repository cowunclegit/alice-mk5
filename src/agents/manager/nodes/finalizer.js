import readline from 'readline/promises';
import { BrowserService } from '../../../services/browser_service.js';
import { StorageService } from '../../../services/storage_service.js';

export const finalizer = async (state, config) => {
  const logger = config.configurable.logger;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await logger.info('\n전체 복합 작업이 완료되었습니다.');

  const confirmed = await rl.question('모든 단계가 의도한 대로 동작했나요? (y/n): ');
  
  if (confirmed.toLowerCase() === 'y') {
    const save = await rl.question('이 복합 시퀀스를 새로운 도구로 저장할까요? (y/n): ');
    if (save.toLowerCase() === 'y') {
      const toolName = await rl.question('도구 이름을 입력하세요 (kebab-case): ');
      const sequence = {
        id: toolName,
        tasks: state.tasks,
        metadata: {
          prompt: state.input,
          createdAt: new Date().toISOString()
        }
      };
      // Complex tools could be saved in a 'composite' folder or handled specially
      await StorageService.saveSequence(sequence, 'web'); // Default to web for now
      await logger.info(`복합 도구 "${toolName}"가 저장되었습니다.`);
    }
  }

  // Final cleanup
  try {
    await BrowserService.stopBrowser(state.sessionId);
    await logger.info('Manager: Browser process stopped.');
  } catch (e) {}

  rl.close();
  return { status: 'finished' };
};
