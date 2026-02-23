import { graph } from './graph.js';
import { ManifestService } from '../../services/manifest_service.js';

export const resourceManagerAgent = {
  invoke: async (input, config) => {
    const manifestService = new ManifestService();
    // Active Reconciliation on startup
    await manifestService.sync();

    const url = input.url || '';
    let domain = 'unknown';
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '').split('.')[0];
    } catch (e) {}

    const state = {
      ...input,
      domain,
      status: 'analyzing',
      history: []
    };

    return graph.invoke(state, config);
  }
};
