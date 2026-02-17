import readline from 'readline/promises';
import { StorageService } from '../../services/storage_service.js';

export const finalizer = async (state) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n모든 단계가 완료되었습니다.');
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
      console.log(`도구 "${toolName}"가 저장되었습니다.`);
    }
  }

  rl.close();
  return { status: 'finished' };
};
