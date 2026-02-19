import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/services/storage_service.js', () => ({
  StorageService: {
    loadSequence: jest.fn(() => Promise.resolve({
      id: 'test-tool',
      actions: [{ intent: 'Saved action', keyword: 'NoOp', selector: '#id', args: [] }],
      metadata: { prompt: 'Saved tool prompt' }
    })),
    toolsDir: './src/robots/tools'
  }
}));

const { planner } = await import('../../src/agents/nodes/planner.js');

describe('Planner Node', () => {
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };

  it('should generate a plan based on input', async () => {
    const mockModel = {
      invoke: jest.fn(() => Promise.resolve({
        content: JSON.stringify({
          plan: [
            { intent: 'Open browser', keyword: 'Open Visible Browser', args: ['https://google.com'] }
          ],
          reasoning: 'Starting task'
        })
      }))
    };

    const state = {
      input: 'Go to google.com',
      retryCount: 0,
      selectedResources: ['core.resource']
    };

    const result = await planner(state, { configurable: { model: mockModel, logger: mockLogger } });
    
    expect(result.plan).toHaveLength(1);
    expect(result.status).toBe('planning');
  });
});
