import fs from 'fs/promises';
import path from 'path';
import { RobotBridge } from '../../../services/robot_bridge.js';

export const capture_xml = async (state, config) => {
  const logger = config.configurable.logger;
  
  // Transition logic
  if (!state.remainingSteps || state.remainingSteps.length === 0) {
    return { status: 'finished' };
  }
  const nextStep = state.remainingSteps[0];
  const remaining = state.remainingSteps.slice(1);

  // If first step (Open Application Session), skip XML capture
  if (nextStep.keyword === 'Open Application Session') {
    return {
      currentStep: nextStep,
      remainingSteps: remaining,
      status: 'analyzing'
    };
  }

  await logger.info('AppGraph: Capturing UI XML for discovery...');
  
  // Need to run "Capture App UI XML"
  const result = await RobotBridge.runKeyword('Capture App UI XML', ['app_source.xml'], state.sessionId, ["application/core.resource"]);

  let xml = '';
  try {
    xml = await fs.readFile(path.join(result.tempDir, 'app_source.xml'), 'utf8');
  } catch (e) {
    await logger.error(`AppGraph: Failed to read XML: ${e.message}`);
  }

  return {
    currentStep: nextStep,
    remainingSteps: remaining,
    currentXML: xml,
    status: 'analyzing'
  };
};
