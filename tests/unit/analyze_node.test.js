import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

jest.unstable_mockModule('../../src/services/robot_bridge.js', () => ({
  RobotBridge: {
    runSequence: jest.fn(() => Promise.resolve({
      status: 'pass',
      stdout: 'Success',
      stderr: '',
      tempDir: '/tmp/analyze'
    }))
  }
}));

jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: jest.fn(() => Promise.resolve(JSON.stringify({
      role: 'body',
      name: '',
      children: [{ role: 'button', name: 'Submit', selector: '#btn' }]
    }))),
    mkdir: jest.fn(() => Promise.resolve())
  }
}));

jest.unstable_mockModule('../../src/services/storage_service.js', () => ({
  StorageService: {
    saveSnapshot: jest.fn(() => Promise.resolve())
  }
}));

const { analyzeNode } = await import('../../src/agents/nodes/analyze.js');

describe('Analyze Node', () => {
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  };

  it('should capture and parse AXTREE', async () => {
    const state = {
      sessionId: 'test-session',
      completedSteps: [],
      selectedResources: ['core.resource', 'ax.resource']
    };

    const result = await analyzeNode(state, { configurable: { logger: mockLogger } });
    
    expect(result.axTree.serialized).toContain('button "Submit"');
    expect(result.refMap['e1']).toBe('#btn');
    expect(result.status).toBe('analyzing');
  });
});
