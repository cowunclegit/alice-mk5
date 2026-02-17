import readline from 'readline/promises';
import { StorageService } from '../../services/storage_service.js';

export const finalizer = async (state, config) => {
  const logger = config.configurable.logger;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  const isFailed = lastStep && lastStep.status === 'fail';

  if (isFailed) {
    await logger.error(`\n실행 중 오류가 발생했습니다. (재시도 횟수: ${state.retryCount}/5)`);
    await logger.error(`마지막 실패 이유: ${lastStep.reasoning || '알 수 없는 오류'}`);
    
    // In case of failure, we don't ask to save as a tool
    rl.close();
    return { status: 'error' };
  }

  await logger.info('\n모든 단계가 성공적으로 완료되었습니다.');
  const confirmed = await rl.question('의도한 대로 동작이 되었나요? (y/n): ');
  
  if (confirmed.toLowerCase() === 'y') {
    const save = await rl.question('이 시퀀스를 도구로 저장할까요? (y/n): ');
    if (save.toLowerCase() === 'y') {
      const toolName = await rl.question('도구 이름을 입력하세요 (kebab-case): ');
      const sequence = {
        id: toolName,
        actions: state.completedSteps.map(s => s.action),
        metadata: {
          prompt: state.input,
          createdAt: new Date().toISOString()
        }
      };
      await StorageService.saveSequence(sequence);
      await logger.info(`도구 "${toolName}"가 저장되었습니다.`);
    }
  }

  rl.close();
  return { status: 'finished' };
};
