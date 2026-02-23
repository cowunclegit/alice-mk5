import readline from 'readline/promises';

export const conflicter = async (state, config) => {
  const logger = config.configurable.logger;
  
  // This node should be inserted if planner detects an existing keyword
  // For now, let's keep it simple and integrate into the main flow if needed
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await rl.question(`Keyword "${state.draftKeyword.keywordName}" already exists. Overwrite? (y/n/rename): `);
  rl.close();

  if (answer.toLowerCase() === 'y') {
    return { status: 'verifying' };
  } else if (answer.toLowerCase() === 'rename') {
    const newName = await rl.question('Enter new name: ');
    return { 
      draftKeyword: { ...state.draftKeyword, keywordName: newName },
      status: 'verifying'
    };
  } else {
    return { status: 'idle', reasoning: 'User skipped conflict.' };
  }
};
