import { StorageService } from '../../../services/storage_service.js';
import fs from 'fs/promises';
import path from 'path';

export const resultCollector = async (state, config) => {
  const logger = config.configurable.logger;
  const toolId = state.activeToolId || 'direct';
  const newlyFinalizedFiles = [];

  await logger.info(`ResultCollector: Collecting results for tool "${toolId}"...`);

  for (const step of state.completedSteps) {
    if (step.status === 'pass' && step.result && step.result.tempDir) {
      try {
        const files = await fs.readdir(step.result.tempDir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (['.json', '.txt', '.csv', '.html'].includes(ext) && !['output.xml', 'browser_state.json', 'log.html', 'report.html', 'dom.html'].includes(file)) {
            const finalPath = await StorageService.finalizeResult(
              path.join(step.result.tempDir, file),
              file,
              toolId
            );
            newlyFinalizedFiles.push(finalPath);
            await logger.info(`결과 파일이 저장되었습니다: ${finalPath}`);
          }
        }
      } catch (e) {
        await logger.error(`결과 파일 수집 중 오류: ${e.message}`);
      }
    }
  }

  // Close browser at the end of tool execution
  try {
    const { BrowserService } = await import('../../../services/browser_service.js');
    await BrowserService.stopBrowser(state.sessionId);
    await logger.info('ResultCollector: Browser process stopped.');
  } catch (e) {
    await logger.error(`브라우저 종료 중 오류: ${e.message}`);
  }

  return { 
    status: 'finished',
    extractedFiles: newlyFinalizedFiles // Update state with file paths
  };
};
