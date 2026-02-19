import { extractAndParseJSON } from '../../../lib/json_utils.js';
import * as cheerio from 'cheerio';

export const analyzer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  if (!state.currentXML || state.currentXML.trim() === '') {
    await logger.info('AppAnalyzer: XML is empty. Skipping.');
    return { status: 'analyzing' };
  }

  await logger.info(`AppAnalyzer: Finding selector for intent: "${state.currentStep.intent}"`);

  // Parse XML using cheerio (works for XML too)
  const $ = cheerio.load(state.currentXML, { xmlMode: true });
  
  // Extract candidates - looking for clickable or focusable elements
  const candidates = [];
  $('*').each((i, el) => {
    const node = $(el);
    const accessibilityId = node.attr('accessibility-id') || node.attr('AccessibilityId') || node.attr('content-desc');
    const text = node.attr('text') || node.attr('label') || node.attr('name');
    const className = node.attr('class') || el.name;
    const resourceId = node.attr('resource-id') || node.attr('id');

    if (accessibilityId || text || resourceId) {
      candidates.push({
        accessibilityId,
        text,
        className,
        resourceId,
        tagName: el.name
      });
    }
  });

  const systemPrompt = `You are a desktop application UI analyzer.
Given a list of UI elements (from XML source) and a user intent, find the best technical selector.
Appium prefers AccessibilityId, then Name/Text, then XPath.

### RULES:
- Prefer "accessibility id:VALUE" or "name:VALUE" or "id:VALUE".
- Return ONLY a valid Appium selector string.
- Respond ONLY with a JSON object:
{
  "selector": "the chosen selector",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}
`;

  const userPrompt = `Intent: ${state.currentStep.intent}
Candidates: ${JSON.stringify(candidates.slice(0, 50))}
`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  const parsed = extractAndParseJSON(response.content);
  
  return {
    currentStep: { ...state.currentStep, selector: parsed.selector },
    status: 'analyzing',
    reasoning: parsed.reasoning
  };
};
