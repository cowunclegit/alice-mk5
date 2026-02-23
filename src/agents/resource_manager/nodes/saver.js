import { GeneratorService } from '../../../services/generator_service.js';
import { ManifestService } from '../../../services/manifest_service.js';

export const saver = async (state, config) => {
  const logger = config.configurable.logger;
  const genService = new GeneratorService();
  const manifestService = new ManifestService();

  if (!state.draftKeyword || !state.domain) {
    return { status: 'error', reasoning: 'Missing keyword or domain data for saving.' };
  }

  await logger.info(`ResourceManager Saver: Processing "${state.draftKeyword.action}" for keyword "${state.draftKeyword.keywordName}"`);

  if (state.draftKeyword.action === 'delete') {
    await genService.removeKeyword(state.domain, state.draftKeyword.keywordName);
    return { status: 'idle', reasoning: `Keyword ${state.draftKeyword.keywordName} removed.` };
  }

  // 1. Generate final code string
  const keywordBody = state.draftKeyword.steps
    .map(s => `    ${s.keyword}${(s.args && s.args.length > 0) ? '    ' + s.args.join('    ') : ''}`)
    .join('\n');
  
  const argsLine = state.draftKeyword.arguments.length > 0 
    ? `    [Arguments]    ${state.draftKeyword.arguments.map(a => `\${${a}}`).join('    ')}`
    : '';

  const fullKeywordContent = `${argsLine}\n${keywordBody}\n`;

  // 2. Update .resource file
  await genService.updateResourceFile(state.domain, state.draftKeyword.keywordName, fullKeywordContent);

  // 3. Update manifest aliases (LLM generated)
  const resourcePath = `web/${state.domain}.resource`;
  const existingMappings = await manifestService.getMappings();
  const existingAliases = existingMappings[resourcePath] || [];
  const newAliases = [...new Set([...existingAliases, ...(state.aliases || [])])];
  
  await manifestService.addMapping(resourcePath, newAliases);

  return {
    status: 'idle',
    finalResourcePath: resourcePath
  };
};
