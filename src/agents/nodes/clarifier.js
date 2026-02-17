import readline from 'readline/promises';

export const clarifier = async (state) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  if (state.candidates && state.candidates.length > 0 && !state.currentStep.selector) {
    console.log('\n의도에 맞는 요소를 여러 개 찾았습니다:', state.currentStep.intent);
    state.candidates.forEach((c, i) => {
      console.log(`${i + 1}: ${c.tag} - "${c.text}" [${c.selector}]`);
    });
    
    const choice = await rl.question('요소를 선택(번호)하거나 직접 셀렉터를 입력하세요: ');
    rl.close();

    const num = parseInt(choice);
    if (!isNaN(num) && num > 0 && num <= state.candidates.length) {
      return {
        currentStep: { ...state.currentStep, selector: state.candidates[num - 1].selector },
        status: 'executing'
      };
    } else {
      return {
        currentStep: { ...state.currentStep, selector: choice },
        status: 'executing'
      };
    }
  }

  rl.close();
  return { status: 'executing' };
};
