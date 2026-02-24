import { RobotBridge } from '../../../services/robot_bridge.js';
import { AnalysisService } from '../../../services/analysis_service.js';
import fs from 'fs/promises';

export const captureDom = async (state, config) => {
  const logger = config.configurable.logger;
  
  // Initial Navigation: If we have a domain but browser is blank, we can attempt a generic navigation to the homepage.
  // However, for complex states (like search results), the ManagerAgent should orchestrate this via web_agent first.
  if (state.domain && state.domain !== 'unknown') {
    const result = await RobotBridge.runKeyword('Get Location', [], state.sessionId, ['web/core.resource'], logger, 'PREFLIGHT');
    const currentUrl = result.stdout || '';
    
    if (currentUrl === '' || currentUrl.includes('about:blank')) {
      await logger.info(`ResourceManager: Browser is blank. Navigating to base domain ${state.domain} for initial analysis...`);
      const targetUrl = `https://www.${state.domain}.com`;
      await RobotBridge.runKeyword('Open Visible Browser', [targetUrl], state.sessionId, ['web/core.resource'], logger, 'INIT-NAV');
    }
  }

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
