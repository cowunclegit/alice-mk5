import { PostProcessor } from '../../src/lib/post_processor.js';

describe('PostProcessor.filterCleanHistory', () => {
  it('should filter out failed tasks and keep only the latest successful ones', () => {
    const history = [
      { taskId: 'T1', intent: 'Search', status: 'finished', robot_history: [{ keyword: 'Open' }] },
      { taskId: 'T2', intent: 'Click', status: 'error', robot_history: [{ keyword: 'Click' }] },
      { taskId: 'T2', intent: 'Click Revised', status: 'finished', robot_history: [{ keyword: 'Click2' }] },
      { taskId: 'T3', intent: 'Extract', status: 'finished', robot_history: [{ keyword: 'Extract' }] }
    ];

    const clean = PostProcessor.filterCleanHistory(history);
    
    expect(clean.length).toBe(3);
    expect(clean[0].taskId).toBe('T1');
    expect(clean[1].taskId).toBe('T2');
    expect(clean[1].intent).toBe('Click Revised');
    expect(clean[2].taskId).toBe('T3');
  });

  it('should templatize actions based on lineage', () => {
    const actions = [
      { keyword: 'Type', args: ['hello'] },
      { keyword: 'Click', args: ['submit'] }
    ];
    const lineage = {
      'search_term': { value: 'hello', taskId: 'Input', type: 'input' }
    };

    const { actions: templatized, variables } = PostProcessor.templatize(actions, lineage);
    
    expect(templatized[0].args[0]).toBe('{{var_1}}');
    expect(variables.length).toBe(1);
    expect(variables[0].default).toBe('hello');
  });

  it('should handle actions without args', () => {
    const actions = [{ keyword: 'Finish', args: null }];
    const { actions: templatized } = PostProcessor.templatize(actions, {});
    expect(templatized[0].keyword).toBe('Finish');
  });
});
