import { AnalysisService } from '../../services/analysis_service.js';

export const analyzer = async (state, config) => {
  const model = config.configurable.model;
  
  if (state.currentStep.selector) {
    return { status: 'analyzing' };
  }

  const prunedHTML = AnalysisService.pruneDOM(state.currentHTML);
  const candidates = AnalysisService.extractInteractiveElements(prunedHTML);

  const systemPrompt = `You are a web element analyzer. 
Given a list of interactive elements and a user intent, find the most stable selector for the target element.
Respond ONLY with a JSON object in the format:
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

  const parsed = JSON.parse(response.content);
  
  const updatedStep = { ...state.currentStep, selector: parsed.selector };

  return {
    currentStep: updatedStep,
    candidates: candidates,
    status: 'analyzing',
    reasoning: parsed.reasoning
  };
};
