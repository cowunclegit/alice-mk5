import readline from 'readline/promises';
import { BrowserService } from '../../../services/browser_service.js';
import { StorageService } from '../../../services/storage_service.js';
import { extractAndParseJSON } from '../../../lib/json_utils.js';
import fs from 'fs/promises';
import path from 'path';

export const finalizer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await logger.info('\n전체 복합 작업이 완료되었습니다.');

  const confirmed = await rl.question('모든 단계가 의도한 대로 동작했나요? (y/n): ');
  
  if (confirmed.toLowerCase() === 'y') {
    const save = await rl.question('이 시퀀스를 재사용 가능한 도구로 최적화하여 저장할까요? (y/n): ');
    if (save.toLowerCase() === 'y') {
      
      await logger.info('Manager: Optimizing steps and identifying variables for tool creation...');

      // 1. Read available keywords to prevent hallucination
      let availableKeywords = "";
      try {
        const webCore = await fs.readFile(path.join(process.cwd(), 'src/robots/resources/web/core.resource'), 'utf8');
        availableKeywords += webCore.split('*** Keywords ***')[1] || "";
      } catch (e) {}

      // 2. Prepare context for optimization
      const allActions = state.history.map(h => h.action);

      const systemPrompt = `You are a Robot Framework tool optimizer.
Convert the execution history into a REUSABLE tool template.

### ALLOWED KEYWORDS (USE ONLY THESE):
${availableKeywords}

### RULES:
1. NO VIRTUAL KEYWORDS: Use ONLY the keywords listed above. Do NOT invent keywords like "Navigate To Top News URL".
2. DATA-DRIVEN ACTIONS: If a step used a dynamic value from a previous step (like a URL), replace it with a variable placeholder like "{{url}}".
3. SELECTOR ABSTRACTION: Set "selector": null for UI actions to allow dynamic discovery.
4. Respond ONLY with a JSON object:
{
  "title": "Clear Tool Name",
  "description": "What this tool does",
  "actions": [
    { "keyword": "Keyword", "args": ["{{var}}"] }
  ],
  "variables": [
    { "name": "var", "description": "Description of the variable" }
  ]
}
`;

      const userPrompt = `Original Prompt: ${state.input}
Actual Executed Actions: ${JSON.stringify(allActions)}
Data Gathered during execution: ${JSON.stringify(state.dataStore)}
`;

      const response = await model.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const optimized = extractAndParseJSON(response.content);
      const toolName = await rl.question('도구의 ID를 입력하세요 (kebab-case): ');
      
      const sequence = {
        id: toolName,
        title: optimized.title,
        description: optimized.description,
        actions: optimized.actions,
        variables: optimized.variables,
        metadata: {
          originalPrompt: state.input,
          createdAt: new Date().toISOString()
        }
      };

      await StorageService.saveSequence(sequence, 'web'); 
      await logger.info(`최적화된 도구 "${optimized.title}"가 저장되었습니다. (ID: ${toolName})`);
    }
  }

  try {
    await BrowserService.stopBrowser(state.sessionId);
    await logger.info('Manager: Browser process stopped.');
  } catch (e) {}

  rl.close();
  return { status: 'finished' };
};
