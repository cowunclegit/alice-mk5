import fs from 'fs/promises';
import path from 'path';

export const resourceSelector = async (state, config) => {
  const logger = config.configurable.logger;
  const input = state.input.toLowerCase();
  const manifestPath = path.join(process.cwd(), 'src/robots/resources/manifest.json');
  
  let selected = ['web/core.resource']; // Always include core web
  
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    for (const [resPath, aliases] of Object.entries(manifest)) {
      // Only select if it's a web resource or platform-agnostic
      if (!resPath.startsWith('web/')) continue;

      const hasMatch = aliases.some(alias => input.includes(alias.toLowerCase()));
      if (hasMatch) {
        selected.push(resPath);
      }
    }
  } catch (e) {
    await logger.error(`ResourceSelector: Failed to read manifest: ${e.message}`);
  }

  await logger.info(`ResourceSelector: Selected resources based on manifest: ${selected.join(', ')}`);
  
  return {
    selectedResources: selected
  };
};
