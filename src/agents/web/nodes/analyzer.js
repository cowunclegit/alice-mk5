import { AnalysisService } from '../../../services/analysis_service.js';
import { extractAndParseJSON } from '../../../lib/json_utils.js';

/**
 * Analyzer node with OpenClaw-inspired AXTree analysis and Intelligent Argument Mapping.
 */
export const analyzer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  if (!state.currentStep) {
    await logger.debug('Analyzer: No current step. Skipping.');
    return { status: 'analyzing' };
  }

  const browserKeywords = ['Open Visible Browser', 'Navigate To URL', 'Capture DOM Source'];
  
  // Skip if selector is already set OR it's a browser-level command
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
1. **Understand Hierarchy**: Look for data labels (e.g., "현재 기온") and their sibling or child values (e.g., "12.5").
2. **Reference by ID**: Every element has a reference like [ref=e123].
3. **List Patterns**: If the intent is to extract a list or several news items, and you see elements marked with [list_pattern], pick one of those elements. The system will use its common class/tag structure to find all similar items.
4. **Analyze Content**: Focus on roles like 'button', 'link', 'textbox', or 'text'.
5. **Select the BEST Ref**: Identify the most specific element that contains the target data or performs the target action.

### RESPONSE FORMAT (JSON):
{
  "refId": "eX OR null",
  "goal_satisfied": true/false,
  "is_list_selection": true/false,
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

  // If it's a list selection, try to generate a selector that matches all items in the list
  if (parsed.is_list_selection && chosenCandidate.isListPattern) {
    // Generate a selector that removes the nth-of-type to match all siblings
    const genericSelector = chosenCandidate.selector.replace(/:nth-of-type\(\d+\)/g, '');
    chosenCandidate.selector = genericSelector;
    await logger.info(`Analyzer: Generalized selector for list extraction: ${genericSelector}`);
  }

  await logger.info(`Analyzer: Selected [${parsed.refId}] "${chosenCandidate.text}" using selector "${chosenCandidate.selector}"`);
  
  const updatedArgs = [...(state.currentStep.args || [])];
  
  // CRITICAL: Argument Mapping Logic
  // List of keywords that ARE KNOWN to take a selector as the first argument
  const genericSelectorKeywords = ['Click Element', 'Type Into Element', 'Extract Element Data', 'Wait For Element', 'Save List Data'];
  
  const isGeneric = genericSelectorKeywords.includes(state.currentStep.keyword);
  const isPlaceholder = !updatedArgs[0] || updatedArgs[0] === 'null' || updatedArgs[0] === '';

  // Only inject the selector if the keyword is generic OR if the first argument is clearly a placeholder
  if (isGeneric || isPlaceholder) {
    updatedArgs[0] = chosenCandidate.selector;
    await logger.debug(`Analyzer: Injected selector into ${state.currentStep.keyword} arguments.`);
  } else {
    await logger.debug(`Analyzer: Skipping injection for specialized keyword ${state.currentStep.keyword} to avoid argument mismatch.`);
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
