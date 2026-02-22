import { router } from '../../src/agents/manager/router.js';

describe('Router Intent Classification', () => {
  const mockLogger = { info: () => {} };
  
  it('should classify "Add a keyword" as resource_management', async () => {
    const mockModel = {
      invoke: async () => ({
        content: JSON.stringify({ category: 'resource_management', reasoning: 'User wants to add a keyword' })
      })
    };

    const state = { input: 'Add a keyword to Naver resource' };
    const config = { configurable: { logger: mockLogger, model: mockModel } };

    const result = await router(state, config);
    
    expect(result.status).toBe('resource_management');
  });

  it('should classify "Search Naver" as planning (automation)', async () => {
    const mockModel = {
      invoke: async () => ({
        content: JSON.stringify({ category: 'automation', reasoning: 'User wants to perform a search' })
      })
    };

    const state = { input: 'Search Naver for weather' };
    const config = { configurable: { logger: mockLogger, model: mockModel } };

    const result = await router(state, config);
    
    expect(result.status).toBe('planning');
  });
});
