import { graph } from './graph.js';
import { ManifestService } from '../../services/manifest_service.js';

export const resourceManagerAgent = {
  invoke: async (input, config) => {
    const manifestService = new ManifestService();
    // Active Reconciliation on startup
    await manifestService.sync();

    const url = input.url || '';
    let domain = 'unknown';
    
    // Try URL first
    try {
      if (url) {
        const urlObj = new URL(url);
        domain = urlObj.hostname.replace('www.', '').split('.')[0];
      }
    } catch (e) {}

    // Fallback: Try extracting from intent (e.g., "Naver", "Google")
    if (domain === 'unknown') {
      const lowerIntent = input.intent.toLowerCase();
      if (lowerIntent.includes('naver')) domain = 'naver';
      else if (lowerIntent.includes('google')) domain = 'google';
      else if (lowerIntent.includes('daum')) domain = 'daum';
    }

    const state = {
      ...input,
      domain,
      status: 'analyzing',
      history: []
    };

    return graph.invoke(state, config);
  }
};
