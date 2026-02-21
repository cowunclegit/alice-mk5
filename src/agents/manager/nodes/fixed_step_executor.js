import { RobotBridge } from '../../../services/robot_bridge.js';
import { ValidationService } from '../../../services/validation_service.js';
import { StorageService } from '../../../services/storage_service.js';

/**
 * Fixed_Step_Executor node for deterministic tool replay.
 */
export const fixedStepExecutor = async (state, config) => {
  const logger = config.configurable.logger;
  const { toolId, platform, variables = {} } = state;

  await logger.info(`FixedStepExecutor: Starting replay for tool "${toolId}"`);

  // 1. Load Tool Manifest
  const manifest = state.manifest;
  if (!manifest) {
    await logger.error('FixedStepExecutor: No manifest found in state.');
    return { status: 'error', reasoning: 'Missing tool manifest.' };
  }

  try {
    // 2. Validate Environment
    ValidationService.validateEnvironment(manifest.environment);
    
    // 3. Validate Variables
    ValidationService.validateVariables(manifest.variables, variables);

    // 4. Execute Steps
    await logger.info(`FixedStepExecutor: Executing ${manifest.steps.length} pre-validated steps.`);
    
    // Replace variables in steps
    const actions = manifest.steps.map(step => {
      const newArgs = step.args.map(arg => {
        if (typeof arg === 'string' && arg.startsWith('{{') && arg.endsWith('}}')) {
          const varName = arg.slice(2, -2);
          return variables[varName] !== undefined ? variables[varName] : arg;
        }
        return arg;
      });
      return { ...step, args: newArgs };
    });

    // Run as a single sequence for maximum speed
    const result = await RobotBridge.runSequence(actions, 1, state.sessionId, manifest.selectedResources || ['web/core.resource'], logger);

    const status = result.status === 'pass' ? 'finished' : 'error';
    await StorageService.recordToolExecution(toolId, variables, status, result);

    if (result.status === 'pass') {
      await logger.info('FixedStepExecutor: Replay completed successfully.');
      return { status: 'finished', dataStore: { ...state.dataStore, ...result.data } };
    } else {
      await logger.error('FixedStepExecutor: Replay failed.');
      return { status: 'error', reasoning: 'Fixed step execution failed.', lastResult: result };
    }

  } catch (e) {
    await logger.error(`FixedStepExecutor: Error during replay: ${e.message}`);
    await StorageService.recordToolExecution(toolId, variables, 'error', { message: e.message });
    return { status: 'error', reasoning: e.message };
  }
};
