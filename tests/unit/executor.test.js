import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/services/robot_bridge.js', () => ({
  RobotBridge: {
    runSequence: jest.fn(() => Promise.resolve({
      status: 'pass',
      stdout: 'Success',
      stderr: '',
      tempDir: '/tmp/robot'
    }))
  }
}));

const { executor } = await import('../../src/agents/nodes/executor.js');

describe('Executor Node', () => {
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };

  it('should execute the current step using RobotBridge', async () => {
    const state = {
      currentStep: { keyword: 'Open Visible Browser', args: ['https://google.com'], intent: 'Open site' },
      completedSteps: [],
      sessionId: 'test-session',
      selectedResources: ['core.resource'],
      refMap: {}
    };

    const result = await executor(state, { configurable: { logger: mockLogger } });
    
    expect(result.status).toBe('executing');
    expect(result.completedSteps).toHaveLength(1);
    expect(result.completedSteps[0].status).toBe('pass');
  });
});
