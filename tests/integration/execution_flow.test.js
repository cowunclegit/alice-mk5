import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/services/robot_bridge.js', () => ({
  RobotBridge: {
    runKeyword: jest.fn((keyword) => {
      if (keyword === 'Capture DOM Source') {
        return Promise.resolve({ status: 'pass', stdout: '<html><body><button id="login-btn">Login</button></body></html>' });
      }
      return Promise.resolve({ status: 'pass', output: 'Done' });
    })
  }
}));

jest.unstable_mockModule('readline/promises', () => ({
  default: {
    createInterface: jest.fn(() => ({
      question: jest.fn(() => Promise.resolve('y')),
      close: jest.fn()
    }))
  }
}));

const { graph } = await import('../../src/agents/graph.js');

describe('Execution Flow Integration', () => {
  it('should run the complete flow from planning to validation', async () => {
    const mockModel = {
      invoke: jest.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({
            plan: [
              { intent: 'Open browser', keyword: 'Open Visible Browser', args: ['https://example.com'] }
            ]
          })
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            selector: 'body',
            confidence: 1.0
          })
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            success: true,
            reasoning: 'Matches intent'
          })
        })
    };

    const initialState = {
      input: 'Open example.com',
      completedSteps: [],
      remainingSteps: [],
      context: {},
      retryCount: 0,
      status: 'idle'
    };

    const result = await graph.invoke(initialState, { configurable: { model: mockModel } });
    
    expect(result.completedSteps).toHaveLength(1);
    expect(result.completedSteps[0].action.intent).toBe('Open browser');
  });
});
