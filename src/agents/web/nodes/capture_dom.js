import { RobotBridge } from '../../../services/robot_bridge.js';
import fs from 'fs/promises';
import path from 'path';

export const captureDom = async (state, config) => {
  const logger = config.configurable.logger;
  
  // Keywords that don't need AXTree analysis because they have internal selectors or logic
  const specializedKeywords = [
    'Search Naver', 
    'Click Naver News Tab', 
    'Open Visible Browser',
    'Navigate To URL',
    'Close Session Browser',
    'Analyze Data',
    'Summarize Results',
    'Read Local Data'
  ];

  const isSpecialized = state.currentStep && specializedKeywords.includes(state.currentStep.keyword);
  
  // Only capture if:
  // 1. Current step is NOT specialized
  // 2. Current step needs a selector (not provided by planner)
  // 3. We don't have AXTree yet
  // 4. Browser is open
  const hasBrowserHistory = [...state.pastHistory, ...state.completedSteps].some(s => s.status === 'pass');

  if (state.currentStep && !isSpecialized && !state.currentStep.selector && !state.currentHTML && hasBrowserHistory) {
    await logger.info('Graph: Capturing Accessibility Tree for element discovery...');
    
    // Give dynamic elements a moment to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await RobotBridge.runKeyword('Capture Accessibility Tree', ['axtree.json'], state.sessionId, state.selectedResources, logger, 'CAPTURE-AX');

    let rawAXTree = null;
    try {
      if (result.savedFilePath) {
        const content = await fs.readFile(result.savedFilePath, 'utf8');
        rawAXTree = JSON.parse(content);
      }
    } catch (e) {
      await logger.error(`Graph: Failed to read captured AXTree: ${e.message}`);
    }

    return {
      currentHTML: rawAXTree, // We use currentHTML field to store the JSON tree for analysis
      status: 'analyzing'
    };
  }
  return { status: 'analyzing' };
};
