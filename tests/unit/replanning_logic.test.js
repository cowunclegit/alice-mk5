import { decomposer } from '../../src/agents/manager/nodes/decomposer.js';

describe('Replanning Logic', () => {
  it('should trigger replanning if status is replanning', async () => {
    let logMessage = '';
    const mockLogger = { 
      info: (msg) => { logMessage = msg; }, 
      error: () => {} 
    };
    
    const mockModel = { 
      invoke: async () => ({ content: JSON.stringify({ tasks: [], reasoning: "New plan" }) }) 
    };
    const config = { configurable: { logger: mockLogger, model: mockModel } };
    
    const state = { 
      input: "Task", 
      status: "replanning", 
      history: [{ status: "failed" }],
      replanCount: 0
    };

    await decomposer(state, config);
    expect(logMessage).toContain("Re-planning mission");
  });

  it('should abort if replan limit is exceeded', async () => {
    const mockLogger = { info: () => {}, error: () => {} };
    const mockModel = { invoke: async () => ({}) };
    const config = { configurable: { logger: mockLogger, model: mockModel } };

    const state = { 
      status: "replanning", 
      replanCount: 6
    };

    const result = await decomposer(state, config);
    expect(result.status).toBe('error');
    expect(result.reasoning).toContain('Maximum replan attempts');
  });
});
