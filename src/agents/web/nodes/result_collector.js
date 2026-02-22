import { StorageService } from '../../../services/storage_service.js';
import { DataUtils } from '../../../lib/data_utils.js';
import fs from 'fs/promises';
import path from 'path';

export const resultCollector = async (state, config) => {
  const logger = config.configurable.logger;
  const toolId = state.activeToolId || 'direct';
  const newlyFinalizedFiles = [];
  const newDataStoreUpdates = {};

  await logger.info(`ResultCollector: Standardizing results into unified dataStore...`);

  for (const step of state.completedSteps) {
    if (step.status === 'pass' && step.result) {
      const resultFiles = [];
      
      // 1. Collect from explicit path
      if (step.result.savedFilePath) {
        resultFiles.push({
          tempPath: step.result.savedFilePath,
          name: path.basename(step.result.savedFilePath)
        });
      }

      // 2. Collect from tempDir (fallback/additional files)
      if (step.result.tempDir) {
        try {
          const files = await fs.readdir(step.result.tempDir);
          for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const filePath = path.join(step.result.tempDir, file);
            if (['.json', '.txt', '.csv', '.html', '.png', '.jpg'].includes(ext) && 
                !['output.xml', 'browser_state.json', 'log.html', 'report.html', 'dom.html'].includes(file)) {
              
              if (!resultFiles.some(rf => rf.name === file)) {
                resultFiles.push({ tempPath: filePath, name: file });
              }
            }
          }
        } catch (e) {}
      }

      // 3. Collect direct result values from stdout
      if (step.result.stdout) {
        const valueMatches = step.result.stdout.matchAll(/RESULT_VALUE: (.*)/g);
        for (const match of valueMatches) {
          const val = match[1].trim();
          const cleanIntent = (step.action.intent || 'result').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
          const key = `text_${cleanIntent}`;
          
          await logger.debug(`ResultCollector: Capturing direct value for key: ${key}`);
          newDataStoreUpdates[key] = {
            type: 'text',
            value: val,
            step_intent: step.action.intent,
            timestamp: new Date().toISOString()
          };
          // Also add a simplified top-level key for the summarizer
          newDataStoreUpdates[`summary_${key}`] = val;
        }
      }

      // 4. Finalize and map to standardized dataStore entries
      for (const rf of resultFiles) {
        try {
          if (newlyFinalizedFiles.some(f => f.endsWith(rf.name))) continue;

          const finalPath = await StorageService.finalizeResult(rf.tempPath, rf.name, toolId);
          newlyFinalizedFiles.push(finalPath);

          const ext = path.extname(rf.name).toLowerCase();
          const key = path.basename(rf.name, ext);
          
          await logger.debug(`ResultCollector: Standardizing ${rf.name} -> key: ${key}`);

          newDataStoreUpdates[key] = {
            type: 'file',
            format: ext.replace('.', ''),
            path: finalPath,
            step_intent: step.action.intent,
            timestamp: new Date().toISOString()
          };
          // Also add a flat key for direct access
          newDataStoreUpdates[`${key}_path`] = finalPath;

          if (ext === '.json') {
            const content = await fs.readFile(finalPath, 'utf8');
            newDataStoreUpdates[key].data = JSON.parse(content);
          }
        } catch (e) {
          await logger.error(`ResultCollector: Failed to finalize ${rf.name}: ${e.message}`);
        }
      }
    }
  }

  await logger.info(`ResultCollector: Successfully collected ${Object.keys(newDataStoreUpdates).length} result entries.`);

  // Determine final status
  const lastStep = state.completedSteps[state.completedSteps.length - 1];
  let finalStatus = 'finished';
  if (state.completedSteps.length === 0 || (lastStep && lastStep.status === 'fail')) {
    finalStatus = 'error';
  }

  // COMPACT DataStore
  const mergedDataStore = { ...state.dataStore, ...newDataStoreUpdates };
  const compactedDataStore = DataUtils.compact(mergedDataStore);

  if (!state.isSubAgent) {
    try {
      const { BrowserService } = await import('../../../services/browser_service.js');
      await BrowserService.stopBrowser(state.sessionId);
    } catch (e) {}
  }

  return { 
    status: finalStatus,
    extractedFiles: newlyFinalizedFiles,
    dataStore: compactedDataStore
  };
};
