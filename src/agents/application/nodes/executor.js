import { RobotBridge } from '../../../services/robot_bridge.js';
import { AppiumService } from '../../../services/appium/index.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  
  if (!state.currentStep) {
    return { status: 'error' };
  }

  const { keyword, args, selector } = state.currentStep;
  
  // If keyword requires an element but selector is missing
  if (['Click Application Element', 'Type Into Application Element'].includes(keyword) && !selector) {
    await logger.error(`AppExecutor: Selector missing for keyword "${keyword}". Aborting.`);
    return {
      status: 'error',
      reasoning: `No selector found for action: ${state.currentStep.intent}`
    };
  }

  const finalArgs = selector ? [selector, ...args] : args;

  // Check if Appium server is running
  const isAppiumRunning = await AppiumService.isServerRunning();
  if (!isAppiumRunning) {
    const serverUrl = await AppiumService.getServerUrl();
    await logger.error(`AppExecutor: Appium server not found at ${serverUrl}. Please start it with 'appium' command.`);
    return {
      status: 'error',
      reasoning: `Appium server not running at ${serverUrl}`
    };
  }

  await logger.info(`AppExecutor: Running step "${keyword}" with args: ${JSON.stringify(finalArgs)}`);

  const appiumUrl = await AppiumService.getServerUrl();
  const caps = state.appCapabilities;
  const actions = [];
  
  if (keyword !== 'Open Application Session') {
    actions.push({
      keyword: 'Open Application Session',
      args: [appiumUrl, caps.platformName, caps.app, caps.automationName, caps.deviceName]
    });
  }
  
  actions.push({ keyword, args: finalArgs });

  const stepNumber = state.completedSteps.length + 1;
  const stepLabel = state.taskId ? `${state.taskId}-${stepNumber}` : stepNumber;
  const result = await RobotBridge.runSequence(actions, stepLabel, state.sessionId, state.selectedResources, logger);

  if (result.status === 'pass') {
    await logger.info(`AppExecutor: Success.`);
  } else {
    await logger.error(`AppExecutor: Failed.`);
    await logger.debug(`Robot Stdout: ${result.stdout}`);
    await logger.debug(`Robot Stderr: ${result.stderr}`);
  }

  return {
    status: 'executing',
    context: { ...state.context, lastResult: result }
  };
};
