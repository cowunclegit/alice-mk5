import { graph } from '../../src/agents/web/graph.js';

describe('Web Reactive Loop', () => {
  it('should compile the graph successfully', () => {
    expect(graph).toBeDefined();
  });

  // More complex state transition tests would require mocking LLM responses
  // and RobotBridge execution, which is out of scope for unit tests of the graph structure.
});
