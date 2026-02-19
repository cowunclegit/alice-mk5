import fs from 'fs/promises';
import path from 'path';

export const resourceSelector = async (state, config) => {
  const logger = config.configurable.logger;
  const input = state.input.toLowerCase();
  const manifestPath = path.join(process.cwd(), 'src/robots/resources/web/manifest.json');
  
  let selected = ['web/core.resource']; // Always include core
  
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    for (const [filename, aliases] of Object.entries(manifest)) {
      // Check if the input contains the filename itself or any of its aliases
      const hasMatch = aliases.some(alias => input.includes(alias.toLowerCase()));
      
      if (hasMatch) {
        selected.push(`web/${filename}`);
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
