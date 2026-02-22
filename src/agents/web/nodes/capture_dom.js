import fs from 'fs/promises';
import path from 'path';
import { RobotBridge } from '../../../services/robot_bridge.js';

export const captureDom = async (state, config) => {
  const logger = config.configurable.logger;
  
  // Only capture if:
  // 1. Current step needs a selector
  // 2. We don't have HTML yet
  // 3. We have at least one successful step in history (browser is open)
  const hasBrowserHistory = state.completedSteps.some(s => s.status === 'pass');

  if (state.currentStep && !state.currentStep.selector && !state.currentHTML && hasBrowserHistory) {
    await logger.info('Graph: Capturing DOM for element discovery...');
    
    const mapToAction = (step) => {
      const sBrowser = ['Open Visible Browser', 'Navigate To URL', 'Capture DOM Source'].includes(step.keyword);
      const sValidSel = step.selector && typeof step.selector === 'string' && step.selector.trim() !== '' && step.selector.toLowerCase() !== 'null';
      const sArgs = Array.isArray(step.args) ? step.args : [];
      return {
        keyword: step.keyword,
        args: (sValidSel && !sBrowser) ? [step.selector, ...sArgs] : sArgs
      };
    };

    const historyActions = state.completedSteps.filter(s => s.status === 'pass').map(s => mapToAction(s.action));
    
    // Wait for dynamic content to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await RobotBridge.runSequence([
      ...historyActions,
      { keyword: 'Capture DOM Source', args: ['dom.html'] }
    ], state.completedSteps.length + 1, state.sessionId, state.selectedResources);

    let html = '';
    try {
      html = await fs.readFile(path.join(result.tempDir, 'dom.html'), 'utf8');
    } catch (e) {
      await logger.error(`Graph: Failed to read captured DOM: ${e.message}`);
    }

    return {
      currentHTML: html,
      status: 'analyzing'
    };
  }
  return { status: 'analyzing' };
};
