import { AnalysisService } from '../../../services/analysis_service.js';
import { extractAndParseJSON } from '../../../lib/json_utils.js';

/**
 * Analyzer node with OpenClaw-inspired AXTree analysis and Intelligent Argument Mapping.
 * Now uses real computed accessibility state from the browser.
 */
export const analyzer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  const specializedKeywords = [
    'Search Naver', 
    'Click Naver News Tab', 
    'Open Visible Browser',
    'Navigate To URL',
    'Analyze Data',
    'Summarize Results',
    'Read Local Data'
  ];

  if (!state.currentStep || specializedKeywords.includes(state.currentStep.keyword)) {
    await logger.debug(`Analyzer: Skipping specialized keyword "${state.currentStep?.keyword}"`);
    return { status: 'analyzing' };
  }

  const browserKeywords = ['Open Visible Browser', 'Navigate To URL', 'Capture DOM Source', 'Capture Accessibility Tree'];
  if (state.currentStep.selector && typeof state.currentStep.selector === 'string' && state.currentStep.selector.trim() !== '') {
    return { status: 'analyzing' };
  }
  if (browserKeywords.includes(state.currentStep.keyword)) {
    return { status: 'analyzing' };
  }

  if (!state.currentHTML) {
    await logger.info('Analyzer: AXTree is empty. Skipping analysis.');
    return { status: 'analyzing' };
  }

  await logger.info(`Analyzer: Analyzing page structure for intent: "${state.currentStep.intent}"`);

  // Process the structured JSON tree from captureDom
  const candidates = AnalysisService.processRawAXTree(state.currentHTML);
  const axTree = AnalysisService.getAccessibilityTree(candidates);

  const systemPrompt = `You are a Senior Web Analyst using Accessibility Trees (AXTree).
Identify the best element [ref=eX] to satisfy the intent.

### ACCESSIBILITY TREE:
${axTree}

### USER MISSION: "${state.input}"
### CURRENT STEP INTENT: "${state.currentStep.intent}"

### STRATEGY:
1. **MISSION COMPLETE?**: If the screen ALREADY shows the final data the user wants, you can suggest finishing early.
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
  
  // Argument Mapping
  const genericSelectorKeywords = ['Click Element', 'Type Into Element', 'Extract Element Data', 'Wait For Element', 'Save List Data', 'Scrape List Data'];
  const isGeneric = genericSelectorKeywords.includes(state.currentStep.keyword);
  
  // Special handling for Naver news extraction where selector is the 2nd argument
  const isNaverExtraction = state.currentStep.keyword === 'Extract Naver News Results';

  if (isGeneric) {
    if (!updatedArgs) updatedArgs = [];
    updatedArgs[0] = chosenCandidate.selector;
    await logger.debug(`Analyzer: Injected selector "${chosenCandidate.selector}" into ${state.currentStep.keyword} at index 0.`);
  } else if (isNaverExtraction) {
    if (!updatedArgs) updatedArgs = ['result.json'];
    updatedArgs[1] = chosenCandidate.selector;
    await logger.debug(`Analyzer: Injected selector "${chosenCandidate.selector}" into ${state.currentStep.keyword} at index 1.`);
  } else {
    // Check for placeholder in any of the first 2 arguments
    for (let idx = 0; idx < Math.min(updatedArgs?.length || 0, 2); idx++) {
      if (updatedArgs[idx] === 'null' || updatedArgs[idx] === '' || updatedArgs[idx] === undefined) {
        updatedArgs[idx] = chosenCandidate.selector;
        await logger.debug(`Analyzer: Injected selector into ${state.currentStep.keyword} at index ${idx}.`);
        break;
      }
    }
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
