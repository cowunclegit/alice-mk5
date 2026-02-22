import { AnalysisService } from '../../../services/analysis_service.js';
import { extractAndParseJSON } from '../../../lib/json_utils.js';

/**
 * Analyzer node with OpenClaw-inspired AXTree analysis and Early Exit intelligence.
 */
export const analyzer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  if (!state.currentStep) {
    await logger.debug('Analyzer: No current step. Skipping.');
    return { status: 'analyzing' };
  }

  const browserKeywords = ['Open Visible Browser', 'Navigate To URL', 'Capture DOM Source'];
  if (state.currentStep.selector && typeof state.currentStep.selector === 'string' && state.currentStep.selector.trim() !== '') {
    return { status: 'analyzing' };
  }
  if (browserKeywords.includes(state.currentStep.keyword)) {
    return { status: 'analyzing' };
  }

  if (!state.currentHTML || state.currentHTML.trim() === '') {
    await logger.info('Analyzer: HTML is empty. Skipping analysis.');
    return { status: 'analyzing' };
  }

  await logger.info(`Analyzer: Analyzing page structure for intent: "${state.currentStep.intent}"`);

  const prunedHTML = AnalysisService.pruneDOM(state.currentHTML);
  const candidates = AnalysisService.extractInteractiveElements(prunedHTML);
  const axTree = AnalysisService.getAccessibilityTree(candidates);

  const systemPrompt = `You are a Senior Web Analyst using Accessibility Trees (AXTree).
Identify the best element [ref=eX] to satisfy the intent.

### ACCESSIBILITY TREE:
${axTree}

### USER MISSION: "${state.input}"
### CURRENT STEP INTENT: "${state.currentStep.intent}"

### STRATEGY:
1. **MISSION COMPLETE?**: If the screen ALREADY shows the final data the user wants (e.g., the exact temperature is visible), you can suggest finishing early.
2. **FIND ELEMENT**: Find the specific [ref=eX] that contains the target data or is the target button.

### RESPONSE FORMAT (JSON):
{
  "refId": "eX OR null",
  "goal_satisfied": true/false,
  "reasoning": "Explanation of choice or mission status",
  "confidence": 0.0 to 1.0
}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: "Identify the best reference now." }
  ]);

  const parsed = extractAndParseJSON(response.content);

  // Early Exit Logic
  if (parsed.goal_satisfied === true) {
    await logger.info('Analyzer: Mission goal satisfied based on visual analysis. Ending loop.');
    return {
      remainingSteps: [],
      status: 'analyzing'
    };
  }

  const chosenCandidate = candidates.find(c => c.refId === parsed.refId);
  if (!chosenCandidate) {
    await logger.error(`Analyzer: RefId ${parsed.refId} not found.`);
    return { status: 'analyzing' };
  }

  await logger.info(`Analyzer: Selected [${parsed.refId}] "${chosenCandidate.text}" using selector "${chosenCandidate.selector}"`);
  
  const updatedArgs = [...(state.currentStep.args || [])];
  if (updatedArgs.length === 0 || !updatedArgs[0] || updatedArgs[0] === 'null' || updatedArgs[0] === '') {
    updatedArgs[0] = chosenCandidate.selector;
  }

  const updatedStep = { 
    ...state.currentStep, 
    selector: chosenCandidate.selector, 
    args: updatedArgs,
    metadata: { ...parsed, text: chosenCandidate.text }
  };

  return {
    currentStep: updatedStep,
    candidates: candidates,
    status: 'analyzing'
  };
};
