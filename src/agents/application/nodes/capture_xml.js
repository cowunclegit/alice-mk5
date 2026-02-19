import fs from 'fs/promises';
import path from 'path';
import { RobotBridge } from '../../../services/robot_bridge.js';
import { AppiumService } from '../../../services/appium/index.js';

export const capture_xml = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.remainingSteps || state.remainingSteps.length === 0) {
    return { status: 'finished' };
  }
  const nextStep = state.remainingSteps[0];
  const remaining = state.remainingSteps.slice(1);

  if (nextStep.keyword === 'Open Application Session') {
    return {
      currentStep: nextStep,
      remainingSteps: remaining,
      status: 'analyzing'
    };
  }

  await logger.info('AppGraph: Capturing UI XML for discovery...');
  
  const appiumUrl = await AppiumService.getServerUrl();
  const caps = state.appCapabilities;
  
  const openAction = {
    keyword: 'Open Application Session',
    args: [appiumUrl, caps.platformName, caps.app, caps.automationName, caps.deviceName]
  };

  const result = await RobotBridge.runSequence([
    openAction,
    { keyword: 'Capture App UI XML', args: ['app_source.xml'] }
  ], state.completedSteps.length + 1, state.sessionId, ["application/core.resource"]);

  if (result.status !== 'pass') {
    await logger.error('AppGraph: XML Capture Robot run failed.');
    await logger.debug(`Stdout: ${result.stdout}`);
    await logger.debug(`Stderr: ${result.stderr}`);
  }

  let xml = '';
  try {
    const xmlPath = path.join(result.tempDir, 'app_source.xml');
    xml = await fs.readFile(xmlPath, 'utf8');
    await logger.info('AppGraph: UI XML captured successfully.');
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
