import { jest } from '@jest/globals';
import { validator } from '../../src/agents/nodes/validator.js';

describe('Validator Node', () => {
  it('should validate execution results against intent', async () => {
    const mockModel = {
      invoke: jest.fn(() => Promise.resolve({
        content: JSON.stringify({
          success: true,
          reasoning: 'Matches intent'
        })
      }))
    };

    const state = {
      input: 'Open google.com',
      currentStep: { intent: 'Open browser' },
      context: { lastResult: { status: 'pass', stdout: 'Done' } },
      completedSteps: []
    };

    const result = await validator(state, { configurable: { model: mockModel } });
    
    expect(result.completedSteps).toHaveLength(1);
    expect(result.completedSteps[0].status).toBe('pass');
    expect(result.status).toBe('validating');
  });
});
