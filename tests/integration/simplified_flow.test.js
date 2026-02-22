import { managerGraph } from '../../src/agents/manager/graph.js';
import { graph as webGraph } from '../../src/agents/web/graph.js';

// We can't easily run full integration tests without mocking the entire LLM and Browser stack.
// This test serves as a placeholder to ensure the entry points are valid.
describe('Simplified Flow Integration', () => {
  it('should export valid graphs for manager and web agents', () => {
    expect(managerGraph).toBeDefined();
    expect(webGraph).toBeDefined();
  });
});
