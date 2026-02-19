import { StorageService } from '../../../services/storage_service.js';
import fs from 'fs/promises';
import path from 'path';

export const toolLoader = async (state, config) => {
  const logger = config.configurable.logger;
  const input = state.input.toLowerCase();
  const toolId = input.replace('run tool ', '').replace('use tool ', '').trim();
  const manifestPath = path.join(process.cwd(), 'src/robots/resources/manifest.json');
  
  await logger.info(`Router: Routing to Tool Execution for "${toolId}"`);
  
  try {
    const sequence = await StorageService.loadSequence(toolId, 'web');
    
    // Find relevant resources using manifest
    let selected = ['web/core.resource'];
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      const toolText = JSON.stringify(sequence).toLowerCase();

      for (const [resPath, aliases] of Object.entries(manifest)) {
        if (!resPath.startsWith('web/')) continue;

        const hasMatch = aliases.some(alias => toolText.includes(alias.toLowerCase()));
        if (hasMatch) {
          selected.push(resPath);
        }
      }
    } catch (e) {
      await logger.error(`ToolLoader: Manifest error: ${e.message}`);
    }

    return {
      plan: sequence.actions,
      remainingSteps: sequence.actions,
      selectedResources: selected,
      activeToolId: toolId, // Set tool ID for naming
      status: 'executing',
      reasoning: `Executing verified tool: ${toolId}`
    };
  } catch (e) {
    throw new Error(`Tool "${toolId}" not found.`);
  }
};
