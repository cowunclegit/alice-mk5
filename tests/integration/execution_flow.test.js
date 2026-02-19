import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

jest.unstable_mockModule('../../src/services/robot_bridge.js', () => ({
  RobotBridge: {
    runKeyword: jest.fn(() => Promise.resolve({ 
      status: 'pass', 
      tempDir: '/tmp/test' 
    })),
    runSequence: jest.fn(() => Promise.resolve({
      status: 'pass',
      tempDir: '/tmp/test'
    }))
  }
}));

jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: jest.fn((filePath) => {
      if (filePath.endsWith('manifest.json')) return Promise.resolve('{}');
      if (filePath.endsWith('ax_tree.json')) return Promise.resolve(JSON.stringify({
        role: 'body',
        name: '',
        children: [{ role: 'button', name: 'Submit', selector: '#btn' }]
      }));
      return Promise.resolve('mock-content');
    }),
    mkdir: jest.fn(() => Promise.resolve()),
    readdir: jest.fn(() => Promise.resolve([])),
    writeFile: jest.fn(() => Promise.resolve())
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
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };

  it('should run the optimized flow with AXTREE and ROLE Snapshot', async () => {
    const mockModel = {
      invoke: jest.fn()
        // Planner mock
        .mockResolvedValueOnce({
          content: JSON.stringify({
            plan: [
              { intent: 'Click submit', keyword: 'Click Element', args: ['e1'] }
            ],
            reasoning: 'Need to click button'
          })
        })
        // Validator mock
        .mockResolvedValueOnce({
          content: JSON.stringify({
            success: true,
            intentMet: true,
            reasoning: 'Goal met'
          })
        })
    };

    const initialState = {
      input: 'Click the button',
      completedSteps: [],
      sessionId: 'test-session',
      selectedResources: ['core.resource']
    };

    const result = await graph.invoke(initialState, { 
      configurable: { model: mockModel, logger: mockLogger } 
    });
    
    expect(result.status).toBe('finished');
    expect(result.completedSteps).toHaveLength(1);
    expect(result.completedSteps[0].action.args[0]).toBe('#btn'); // Resolved ref
  });
});
