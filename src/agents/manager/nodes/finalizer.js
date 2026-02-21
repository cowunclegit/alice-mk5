import readline from 'readline/promises';
import { BrowserService } from '../../../services/browser_service.js';
import { StorageService } from '../../../services/storage_service.js';
import { ValidationService } from '../../../services/validation_service.js';
import { PostProcessor } from '../../../lib/post_processor.js';
import fs from 'fs/promises';
import path from 'path';

export const finalizer = async (state, config) => {
  const logger = config.configurable.logger;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await logger.info('\n전체 복합 작업이 완료되었습니다.');

  const confirmed = process.env.NODE_ENV === 'test' ? 'n' : await rl.question('모든 단계가 의도한 대로 동작했나요? (y/n): ');
  
  if (confirmed.toLowerCase() === 'y' || confirmed.toLowerCase() === 'yes') {
    const save = await rl.question('이 시퀀스를 재사용 가능한 도구로 최적화하여 저장할까요? (y/n): ');
    if (save.toLowerCase() === 'y' || save.toLowerCase() === 'yes') {
      
      await logger.info('Manager: Optimizing steps and identifying variables for tool creation...');

      // 1. Filter Clean History
      const cleanHistory = PostProcessor.filterCleanHistory(state.history);
      
      // 2. Aggregate all robot actions and script paths
      const allActions = [];
      const allScripts = [];
      for (const entry of cleanHistory) {
        if (entry.robot_history) {
          // robot_history contains stepResult objects, we need the action property
          allActions.push(...entry.robot_history.map(h => h.action));
          // Collect temporary script paths
          entry.robot_history.forEach(h => {
            if (h.result && h.result.robotFile) allScripts.push(h.result.robotFile);
            if (h.result && h.result.varsFile) allScripts.push(h.result.varsFile);
          });
        }
      }

      if (allActions.length === 0) {
        await logger.warn('Optimization: No robot actions found to save.');
      } else {
        // 3. Templatize
        const { actions: templatizedActions, variables } = PostProcessor.templatize(allActions, state.lineage);

        // 4. Capture Env Metadata
        const env = await ValidationService.captureEnvMetadata();

        // 5. User Input for Tool ID and Title
        const toolId = await rl.question('도구의 ID를 입력하세요 (kebab-case): ');
        const toolTitle = await rl.question('도구의 제목을 입력하세요: ');
        const toolDesc = await rl.question('도구에 대한 설명을 입력하세요: ');

        // 6. Create Manifest
        const manifest = {
          id: toolId,
          title: toolTitle,
          description: toolDesc,
          platform: 'cross-platform', // Default for multi-agent
          version: '1.0.0',
          variables,
          environment: env,
          steps: templatizedActions,
          scripts: allScripts.map(s => path.basename(s)), // Store filenames in manifest
          metadata: {
            originalPrompt: state.input,
            createdAt: new Date().toISOString()
          }
        };

        // 7. Save Snapshot
        await StorageService.saveToolSnapshot(manifest, allScripts); 
        await logger.info(`최적화된 도구 "${toolTitle}"가 저장되었습니다. (ID: ${toolId})`);
      }
    }
  }

  try {
    await BrowserService.stopBrowser(state.sessionId);
    await logger.info('Manager: Browser process stopped.');
  } catch (e) {}

  rl.close();
  return { status: 'finished' };
};
