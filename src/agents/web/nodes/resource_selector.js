import fs from 'fs/promises';
import path from 'path';

export const resourceSelector = async (state, config) => {
  const logger = config.configurable.logger;
  
  // Use both the current intent AND the original input to find resources
  // This ensures that if the manager splits a task, we still know the overall context (e.g. "Naver")
  const contextText = `${state.input} ${state.originalInput || ''}`.toLowerCase();
  
  const manifestPath = path.join(process.cwd(), 'src/robots/resources/manifest.json');
  
  let selected = ['web/core.resource']; // Always include core web
  
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    for (const [resPath, aliases] of Object.entries(manifest)) {
      if (!resPath.startsWith('web/')) continue;

      const hasMatch = aliases.some(alias => contextText.includes(alias.toLowerCase()));
      if (hasMatch) {
        selected.push(resPath);
      }
    }
  } catch (e) {
    await logger.error(`ResourceSelector: Failed to read manifest: ${e.message}`);
  }

  await logger.info(`ResourceSelector: Selected resources based on context: ${selected.join(', ')}`);
  
  return {
    selectedResources: selected
  };
};
