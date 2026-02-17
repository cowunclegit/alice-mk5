import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/services/robot_bridge.js', () => ({
  RobotBridge: {
    runKeyword: jest.fn(() => Promise.resolve({ status: 'pass', output: 'Done' }))
  }
}));

const { RobotBridge } = await import('../../src/services/robot_bridge.js');
const { executor } = await import('../../src/agents/nodes/executor.js');

describe('Executor Node', () => {
  it('should execute the current step using RobotBridge', async () => {
    const state = {
      currentStep: { keyword: 'Navigate To URL', args: ['https://example.com'], selector: null }
    };

    const result = await executor(state);
    
    expect(RobotBridge.runKeyword).toHaveBeenCalledWith('Navigate To URL', ['https://example.com']);
    expect(result.status).toBe('executing');
  });
});
