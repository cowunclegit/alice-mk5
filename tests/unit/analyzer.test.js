import { jest } from '@jest/globals';
import { analyzer } from '../../src/agents/nodes/analyzer.js';

describe('Analyzer Node', () => {
  it('should resolve a selector based on HTML analysis', async () => {
    const mockModel = {
      invoke: jest.fn(() => Promise.resolve({
        content: JSON.stringify({
          selector: '#login-btn',
          confidence: 0.95
        })
      }))
    };

    const state = {
      currentStep: { intent: 'click login button', keyword: 'Interact With Element', args: ['click'] },
      currentHTML: '<html><body><button id="login-btn">Login</button></body></html>'
    };

    const result = await analyzer(state, { configurable: { model: mockModel } });
    
    expect(result.currentStep.selector).toBe('#login-btn');
    expect(result.status).toBe('analyzing');
  });
});
