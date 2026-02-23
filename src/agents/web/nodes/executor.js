import { RobotBridge } from '../../../services/robot_bridge.js';

export const executor = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  if (!state.currentStep) {
    return { status: 'validating' };
  }

  const virtualKeywords = ['Analyze Data', 'Summarize Results', 'Read Local Data'];
  const isVirtual = virtualKeywords.includes(state.currentStep.keyword);

  if (isVirtual) {
    await logger.info(`[${state.taskId || 'Web'}] WebExecutor: Performing Virtual Action "${state.currentStep.keyword}" using LLM.`);
    
    const systemPrompt = `You are a Data Analyst Agent. 
Perform the requested task using the provided context (dataStore).

### CURRENT TASK INTENT:
${state.currentStep.intent}

### AVAILABLE DATA (dataStore):
${JSON.stringify(state.dataStore, null, 2)}

Respond with the result of your analysis or processing. 
If you extracted new specific information, respond in JSON format with "RESULT_VALUE: <value>". 
Otherwise, provide a clear text explanation.`;

    const response = await model.invoke([{ role: 'system', content: systemPrompt }]);
    
    return {
      status: 'executing',
      context: { 
        lastResult: { 
          status: 'pass', 
          stdout: `RESULT_VALUE: ${response.content}`,
          reasoning: 'Task satisfied via LLM virtual execution.'
        } 
      }
    };
  }

  const stepsToRun = state.batch && state.batch.length > 0 ? state.batch : [state.currentStep];
  
  if (stepsToRun.length > 1) {
    await logger.info(`[${state.taskId || 'Web'}] WebExecutor: Batch running ${stepsToRun.length} steps...`);
  } else {
    const { keyword, args } = state.currentStep;
    await logger.info(`[${state.taskId || 'Web'}] WebExecutor: Running "${keyword}" with args: ${JSON.stringify(args)}`);
  }

  const result = await RobotBridge.runSequence(stepsToRun, state.taskId || '1', state.sessionId, state.selectedResources, logger, state.dataStore);

  return {
    status: 'executing',
    context: { lastResult: result }
  };
};
