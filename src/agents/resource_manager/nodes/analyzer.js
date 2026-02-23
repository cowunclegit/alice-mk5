import { extractAndParseJSON } from '../../../lib/json_utils.js';

export const analyzer = async (state, config) => {
  const logger = config.configurable.logger;
  const model = config.configurable.model;

  if (state.aliases && state.aliases.length > 0) return { status: 'planning' };

  await logger.info('ResourceManager: Generating discovery aliases...');

  const systemPrompt = `You are a Web Discovery Agent.
Analyze the current AXTree and domain to brainstorm 3-5 user-friendly aliases for this service.

### Domain: ${state.domain}
### AXTree Summary: ${state.axTree ? 'Present' : 'Missing'}

Respond ONLY with a JSON object:
{
  "aliases": ["alias1", "alias2", "alias3"],
  "reasoning": "Why these are good"
}
`;

  try {
    const response = await model.invoke([{ role: 'system', content: systemPrompt }]);
    const parsed = extractAndParseJSON(response.content);
    return {
      aliases: parsed.aliases,
      status: 'planning'
    };
  } catch (e) {
    await logger.warn(`Alias generation failed: ${e.message}`);
    return { status: 'planning' };
  }
};
