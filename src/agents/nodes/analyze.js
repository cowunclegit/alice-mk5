import { AXUtils } from '../../lib/ax_utils.js';
import { RobotBridge } from '../../services/robot_bridge.js';
import { StorageService } from '../../services/storage_service.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Analyzes the current page state using Accessibility Tree (AXTREE).
 * @param {Object} state 
 * @param {Object} config 
 * @returns {Object} Updated state
 */
export const analyzeNode = async (state, config) => {
  const logger = config.configurable.logger;
  
  // Check if we have at least one successful step (browser is likely open)
  // Or if it's the very first turn (no history yet), we try anyway 
  // because the test environment might have a browser pre-opened or mocked.
  const hasBrowserHistory = state.completedSteps && state.completedSteps.some(s => s.status === 'pass');
  const isInitialTurn = !state.completedSteps || state.completedSteps.length === 0;

  if (!hasBrowserHistory && !isInitialTurn) {
    await logger.info('AnalyzeNode: No browser session detected. Skipping AXTREE capture.');
    return { 
      axTree: null, 
      refMap: {}, 
      status: 'analyzing' 
    };
  }

  await logger.info('AnalyzeNode: Capturing AXTREE for state representation...');
  
  // 1. Trigger Robot keyword to get AX snapshot
  // We MUST include history actions to ensure the browser is open and in the right state.
  const historyActions = (state.completedSteps || [])
    .filter(s => s.status === 'pass')
    .map(s => ({
      keyword: s.action.keyword,
      args: s.action.args || []
    }));

  const captureAction = { keyword: 'Capture AXTREE', args: ['ax_tree.json'] };
  const stepId = `analyze-${state.completedSteps.length}`;

  const result = await RobotBridge.runSequence(
    [...historyActions, captureAction], 
    stepId, 
    state.sessionId, 
    state.selectedResources
  );
  
  if (result.status !== 'pass') {
    if (isInitialTurn) {
      await logger.info(`AnalyzeNode: Initial AXTREE capture skipped or failed (likely no browser open).`);
    } else {
      await logger.error(`AnalyzeNode: Failed to capture AXTREE. This might happen if the page is loading or browser is closed.`);
    }
    return { 
      axTree: null, 
      refMap: {}, 
      status: 'analyzing' 
    };
  }

  // 2. Load the JSON result
  let rawTree;
  try {
    const filePath = path.join(result.tempDir, 'ax_tree.json');
    const content = await fs.readFile(filePath, 'utf8');
    rawTree = JSON.parse(content);
  } catch (e) {
    await logger.error(`AnalyzeNode: Failed to read ax_tree.json. ${e.message}`);
    return { status: 'error' };
  }

  // 3. Process the tree
  const pruned = AXUtils.prune(rawTree);
  if (!pruned) {
    await logger.info('AnalyzeNode: Captured AXTREE is empty.');
    return { axTree: null, refMap: {}, status: 'analyzing' };
  }

  const { tree, refMap } = AXUtils.parse(pruned);
  const serialized = AXUtils.serialize(tree);

  // 4. Persistence for debugging
  const stepNumber = state.completedSteps.length;
  await StorageService.saveSnapshot(state.sessionId, `analyze-${stepNumber}`, {
    axTree: tree,
    refMap: refMap,
    serialized: serialized
  });

  await logger.info(`AnalyzeNode: Successfully captured and parsed AXTREE. ${Object.keys(refMap).length} interactable elements found.`);
  
  return {
    axTree: {
      raw: tree,
      serialized: serialized
    },
    refMap: refMap,
    status: 'analyzing'
  };
};
