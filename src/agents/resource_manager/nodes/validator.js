import { ManifestService } from '../../../services/manifest_service.js';

export const validator = async (state, config) => {
  const logger = config.configurable.logger;
  const manifestService = new ManifestService();
  const mappings = await manifestService.getMappings();

  if (!state.aliases || state.aliases.length === 0) return { status: 'saving' };

  await logger.info('ResourceManager Validator: Checking for alias collisions...');

  const collisions = [];
  for (const [path, aliases] of Object.entries(mappings)) {
    if (path === `web/${state.domain}.resource`) continue;
    
    for (const alias of state.aliases) {
      if (aliases.includes(alias)) {
        collisions.push({ alias, otherPath: path });
      }
    }
  }

  if (collisions.length > 0) {
    const message = collisions.map(c => `Alias "${c.alias}" collision with ${c.otherPath}`).join(', ');
    await logger.warn(`ResourceManager Validator: Collisions detected! ${message}`);
    // Per FR-015, propose merging or ensure uniqueness
    // For now, let's just log and proceed, or we could add a human-in-the-loop step here
    return {
      status: 'saving',
      warnings: collisions
    };
  }

  return { status: 'saving' };
};
