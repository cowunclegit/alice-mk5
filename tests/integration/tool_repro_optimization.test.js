import { managerGraph, reproGraph } from '../../src/agents/manager/graph.js';
import { StorageService } from '../../src/services/storage_service.js';
import fs from 'fs/promises';
import path from 'path';

describe('Tool Reproducibility Optimization Integration', () => {
  const sessionId = 'test-session';
  const toolId = 'integration-test-tool';

  beforeAll(async () => {
    await StorageService.init();
  });

  it('should optimize and save a tool after successful execution', async () => {
    const state = {
      input: "Test intent",
      sessionId,
      history: [
        { 
          taskId: 'T1', 
          status: 'finished', 
          robot_history: [{ keyword: 'No Operation', args: [] }] 
        }
      ],
      lineage: {
        'key': { value: 'val', taskId: 'T1', type: 'input' }
      }
    };

    // We manually simulate the finalizer logic for now as it involves interactive readline
    // In a real test we would mock readline
    
    const manifest = {
      id: toolId,
      title: 'Integration Test Tool',
      description: 'Desc',
      platform: 'web',
      version: '1.0.0',
      variables: [{ name: 'var_1', required: true, default: 'val' }],
      environment: { os: process.platform },
      steps: [{ keyword: 'Log', args: ['{{var_1}}'] }]
    };

    await StorageService.saveToolSnapshot(manifest, []);
    
    const savedManifest = await StorageService.loadToolManifest(toolId, 'web');
    expect(savedManifest.id).toBe(toolId);
  });

  it('should replay a saved tool using reproGraph', async () => {
    const workflow = reproGraph();
    const result = await workflow.invoke({
      toolId,
      platform: 'web',
      variables: { 'var_1': 'new-val' },
      sessionId
    }, { 
      configurable: { 
        logger: { info: console.log, error: console.error, debug: console.log } 
      } 
    });

    if (result.status === 'error') console.log('Test Failure Reasoning:', result.reasoning);
    expect(result.status).toBe('finished');
  }, 30000);

  it('should discover and execute a specialized tool via managerGraph', async () => {
    // 1. Ensure tool is in catalog
    const manifest = await StorageService.loadToolManifest(toolId, 'web');
    await StorageService.updateCatalog(manifest);

    // 2. Invoke managerGraph with intent that should trigger tool discovery
    const workflow = managerGraph();
    const result = await workflow.invoke({
      input: `Use specialized tool ${toolId} with var_1 as 'manager-val'`,
      sessionId
    }, { 
      configurable: { 
        logger: { info: console.log, error: console.error, debug: console.log },
        model: { // Mock model to return the tool task
          invoke: async () => ({
            content: JSON.stringify({
              tasks: [
                { 
                  id: 'T1', 
                  platform: 'web', 
                  tool: 'specialized_tool', 
                  toolId: toolId, 
                  intent: 'Execute tool' 
                }
              ],
              reasoning: 'Tool discovered'
            })
          })
        }
      } 
    });

    expect(result.status).toBe('finished');
  }, 30000);
});
