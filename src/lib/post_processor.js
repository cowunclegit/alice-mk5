import fs from 'fs/promises';
import { LineageTracker } from '../agents/common/lineage_tracker.js';

/**
 * PostProcessor for optimizing execution history and templatizing scripts.
 */
export class PostProcessor {
  /**
   * Filters the history to remove failed or redundant steps.
   * 
   * @param {Array} history - The raw execution history
   * @returns {Array} Clean history containing only successful actions
   */
  static filterCleanHistory(history = []) {
    // Only keep actions that directly contributed to the success
    // For now, we keep all 'finished' steps that weren't followed by a retry of the same task
    const clean = [];
    const taskSuccessMap = new Map();
    
    // Process backwards to find the latest successful execution for each task
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry.status === 'finished' && !taskSuccessMap.has(entry.taskId)) {
        clean.unshift(entry);
        taskSuccessMap.set(entry.taskId, true);
      }
    }
    
    return clean;
  }

  /**
   * Templatizes a list of actions by replacing literal values with variables
   * based on data lineage.
   * 
   * @param {Array} actions - List of actions (keyword + args)
   * @param {Object} lineage - Data lineage information
   * @returns {Object} { templatizedActions, variables }
   */
  static templatize(actions = [], lineage = {}) {
    const variables = [];
    const varMap = new Map(); // value -> varName
    
    const templatizedActions = actions.map(action => {
      if (!action.args) return action;
      const newArgs = action.args.map(arg => {
        if (typeof arg !== 'string') return arg;
        
        // Find if this string exists in lineage
        const source = LineageTracker.findSource(lineage, arg);
        if (source && source.type === 'input') {
          let varName = varMap.get(arg);
          if (!varName) {
            varName = `var_${variables.length + 1}`;
            varMap.set(arg, varName);
            variables.push({
              name: varName,
              description: `Value from ${source.taskId}`,
              required: true,
              default: arg
            });
          }
          return `{{${varName}}}`;
        }
        return arg;
      });
      
      return { ...action, args: newArgs };
    });
    
    return { actions: templatizedActions, variables };
  }
}
