import { jest } from '@jest/globals';

const { validator } = await import('../../src/agents/nodes/validator.js');

describe('Validator Node', () => {
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };

  it('should validate execution results against intent', async () => {
    const mockModel = {
      invoke: jest.fn(() => Promise.resolve({
        content: JSON.stringify({
          success: true,
          intentMet: true,
          reasoning: 'The search results are visible.'
        })
      }))
    };

    const state = {
      input: 'Search for AI',
      completedSteps: [
        { action: { keyword: 'Search Naver', intent: 'Search AI' }, status: 'pass' }
      ],
      axTree: { serialized: 'Mock AXTREE' },
      context: {}
    };

    const result = await validator(state, { configurable: { model: mockModel, logger: mockLogger } });
    
    expect(result.status).toBe('finished');
    expect(result.context.intentMet).toBe(true);
  });
});
