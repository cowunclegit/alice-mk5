import { AnalysisService } from '../../../services/analysis_service.js';
import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const analyzer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;
  
  const browserKeywords = ['Open Visible Browser', 'Navigate To URL', 'Capture DOM Source'];
  if ((state.currentStep.selector && typeof state.currentStep.selector === 'string' && state.currentStep.selector.trim() !== '') || browserKeywords.includes(state.currentStep.keyword)) {
    await logger.debug(`Analyzer: Skipping for keyword: ${state.currentStep.keyword} or existing selector: ${state.currentStep.selector}`);
    return { status: 'analyzing' };
  }

  if (!state.currentHTML || state.currentHTML.trim() === '') {
    await logger.info('Analyzer: HTML is empty or invalid. Skipping analysis.');
    return {
      status: 'analyzing'
    };
  }

  await logger.info(`Analyzer: Finding selector for intent: "${state.currentStep.intent}"`);

  const prunedHTML = AnalysisService.pruneDOM(state.currentHTML);
  const candidates = AnalysisService.extractInteractiveElements(prunedHTML);

  await logger.debug(`Analyzer: Extracted ${candidates.length} candidates.`);

  if (candidates.length === 0) {
    await logger.info('Analyzer: No candidates found in HTML.');
    return {
      candidates: [],
      status: 'clarifying' // Transition to clarifier if no elements found
    };
  }

  const systemPrompt = `You are a web element analyzer. 
Given a list of interactive elements and a user intent, find the most stable technical selector (id, data-testid, unique css) for the target element.

### RULES:
- Return ONLY a valid CSS selector string.
- If you are not sure, pick the most likely candidate from the list.
- DO NOT return "null", "None", or empty strings if interactive elements are available.
- Respond ONLY with a JSON object:
{
  "selector": "the chosen selector",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}
`;

  const userPrompt = `Intent: ${state.currentStep.intent}
Candidates: ${JSON.stringify(candidates)}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const parsed = extractAndParseJSON(response.content);
  await logger.info(`Analyzer: Selected selector "${parsed.selector}" with confidence ${parsed.confidence}`);
  await logger.debug(`Analyzer Reasoning: ${parsed.reasoning}`);
  
  const updatedStep = { ...state.currentStep, selector: parsed.selector };

  return {
    currentStep: updatedStep,
    candidates: candidates,
    status: 'analyzing',
    reasoning: parsed.reasoning
  };
};
