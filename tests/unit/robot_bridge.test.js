import { jest } from '@jest/globals';

jest.unstable_mockModule('child_process', () => ({
  spawn: jest.fn(),
}));

const { spawn } = await import('child_process');
const { RobotBridge } = await import('../../src/services/robot_bridge.js');

describe('RobotBridge', () => {
  it('should execute a robot keyword and return results', async () => {
    const mockSpawn = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          callback(0);
        }
      }),
    };
    spawn.mockReturnValue(mockSpawn);

    const result = await RobotBridge.runKeyword('Open Visible Browser', ['https://example.com']);
    expect(result.status).toBe('pass');
    expect(spawn).toHaveBeenCalled();
  });
});
