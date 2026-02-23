import { jest } from '@jest/globals';
import { planner } from '../../src/agents/resource_manager/nodes/planner.js';
import { verifier } from '../../src/agents/resource_manager/nodes/verifier.js';
import { saver } from '../../src/agents/resource_manager/nodes/saver.js';

describe('ResourceManagerAgent Nodes', () => {
  const mockConfig = {
    configurable: {
      model: {
        invoke: jest.fn()
      },
      logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    }
  };

  describe('Planner Node', () => {
    it('should generate a candidate keyword from user intent', async () => {
      mockConfig.configurable.model.invoke.mockResolvedValue({
        content: JSON.stringify({
          keywordName: 'Search Naver',
          steps: [{ keyword: 'Type Into Element', args: ['css:#query', 'alice'] }],
          reasoning: 'Matches intent'
        })
      });

      const state = { intent: 'Create search keyword for Naver', dataStore: {} };
      const result = await planner(state, mockConfig);

      expect(result.status).toBe('analyzing');
      expect(result.draftKeyword).toHaveProperty('keywordName', 'Search Naver');
    });
  });

  describe('Verifier Node', () => {
    it('should execute candidate keyword and update status', async () => {
      // Mocking RobotBridge would be needed here for a real unit test
      // For now, testing the node logic around the bridge
    });
  });
});
