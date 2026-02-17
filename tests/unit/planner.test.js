import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/services/storage_service.js', () => ({
  StorageService: {
    loadSequence: jest.fn(() => Promise.resolve({
      id: 'test-tool',
      actions: [{ intent: 'Saved action', keyword: 'NoOp', selector: '#id', args: [] }]
    }))
  }
}));

const { planner } = await import('../../src/agents/nodes/planner.js');

describe('Planner Node', () => {
  it('should generate a plan based on input', async () => {
    const mockModel = {
      invoke: jest.fn(() => Promise.resolve({
        content: JSON.stringify({
          plan: [
            { intent: 'Open browser', keyword: 'Open Visible Browser', args: ['https://google.com'] }
          ]
        })
      }))
    };

    const state = {
      input: 'Go to google.com',
      retryCount: 0
    };

    const result = await planner(state, { configurable: { model: mockModel } });
    
    expect(result.plan).toHaveLength(1);
    expect(result.remainingSteps).toHaveLength(1);
    expect(result.status).toBe('planning');
  });

  it('should detect tool execution pattern and load sequence', async () => {
    const state = {
      input: 'run tool test-tool',
      retryCount: 0
    };

    const result = await planner(state, { configurable: {} });
    expect(result.plan).toHaveLength(1);
    expect(result.status).toBe('planning');
    expect(result.plan[0].intent).toBe('Saved action');
  });
});
