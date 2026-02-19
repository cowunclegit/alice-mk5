import { jest } from '@jest/globals';

const { reviser } = await import('../../src/agents/nodes/reviser.js');

describe('Reviser Node', () => {
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };

  it('should revise the plan on failure', async () => {
    const mockModel = {
      invoke: jest.fn(() => Promise.resolve({
        content: JSON.stringify({
          revisedRemainingSteps: [
            { intent: 'Wait and retry', keyword: 'Wait For Element', args: ['#id'] }
          ],
          reasoning: 'Element was missing'
        })
      }))
    };

    const state = {
      input: 'Click search',
      completedSteps: [{ action: { keyword: 'Click', intent: 'Click search' }, status: 'fail' }],
      remainingSteps: [],
      retryCount: 0,
      snapshot: 'Mock Snapshot'
    };

    const result = await reviser(state, { configurable: { model: mockModel, logger: mockLogger } });
    
    expect(result.remainingSteps).toHaveLength(1);
    expect(result.retryCount).toBe(1);
    expect(result.status).toBe('revising');
  });
});
