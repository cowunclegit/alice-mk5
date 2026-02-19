import { extractAndParseJSON } from '../../../lib/json_utils.js';
import * as cheerio from 'cheerio';

export const analyzer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  if (!state.currentXML || state.currentXML.trim() === '') {
    await logger.error('AppAnalyzer: XML is empty. Cannot find selector.');
    return { 
      status: 'error', 
      reasoning: 'UI XML structure could not be captured. App might be closed or unresponsive.' 
    };
  }

  await logger.info(`AppAnalyzer: Finding selector for intent: "${state.currentStep.intent}"`);

  // Parse XML using cheerio
  const $ = cheerio.load(state.currentXML, { xmlMode: true });
  
  const candidates = [];
  $('*').each((i, el) => {
    const node = $(el);
    const accessibilityId = node.attr('accessibility-id') || node.attr('AccessibilityId') || node.attr('identifier');
    const text = node.attr('text') || node.attr('label') || node.attr('name') || node.attr('title');
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
- Use the format: "attribute=value".
- STRATEGIES:
  1. If 'accessibilityId' is present, use: "accessibility_id=VALUE"
  2. If 'text' or 'name' is present, use: "name=VALUE"
  3. If 'resourceId' is present, use: "id=VALUE"
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
