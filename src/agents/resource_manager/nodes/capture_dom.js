import { RobotBridge } from '../../../services/robot_bridge.js';
import { AnalysisService } from '../../../services/analysis_service.js';
import fs from 'fs/promises';

export const captureDom = async (state, config) => {
  const logger = config.configurable.logger;
  
  await logger.info('ResourceManager: Capturing AXTree...');
  
  const result = await RobotBridge.runKeyword(
    'Capture Accessibility Tree', 
    ['axtree.json'], 
    state.sessionId, 
    ['web/core.resource'], 
    logger, 
    'CAPTURE'
  );

  let axTree = null;
  let candidates = [];
  if (result.status === 'pass' && result.savedFilePath) {
    try {
      const content = await fs.readFile(result.savedFilePath, 'utf8');
      axTree = JSON.parse(content);
      candidates = AnalysisService.processRawAXTree(axTree);
    } catch (e) {
      await logger.error(`Failed to parse AXTree: ${e.message}`);
    }
  }

  return {
    axTree,
    candidates,
    status: 'analyzing'
  };
};
