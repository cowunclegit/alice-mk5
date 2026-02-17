import { jest } from '@jest/globals';
import { reviser } from '../../src/agents/nodes/reviser.js';

describe('Reviser Node', () => {
  it('should revise the plan on failure', async () => {
    const mockModel = {
      invoke: jest.fn(() => Promise.resolve({
        content: JSON.stringify({
          revisedRemainingSteps: [
            { intent: 'Try again with different selector', keyword: 'Click', selector: '#alt-id', args: [] }
          ],
          reasoning: 'Original element missing'
        })
      }))
    };

    const state = {
      input: 'Click login',
      completedSteps: [{ action: { intent: 'Click login' }, status: 'fail', error: 'Element not found' }],
      remainingSteps: [],
      retryCount: 0
    };

    const result = await reviser(state, { configurable: { model: mockModel } });
    
    expect(result.remainingSteps).toHaveLength(1);
    expect(result.retryCount).toBe(1);
    expect(result.status).toBe('revising');
  });
});
