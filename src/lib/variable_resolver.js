/**
 * VariableResolver utility to replace ${key} or {{key}} patterns with values from a data object.
 */
export class VariableResolver {
  /**
   * Resolves variables in a string or object.
   * @param {any} target - The string or object containing variables.
   * @param {Object} dataStore - The source of values.
   * @returns {any}
   */
  static resolve(target, dataStore) {
    if (!target) return target;

    if (typeof target === 'string') {
      return target.replace(/\${([^}]+)}|\{\{([^}]+)\}\}/g, (match, p1, p2) => {
        const key = (p1 || p2).trim();
        const value = this._getValue(key, dataStore);
        return value !== undefined ? value : match;
      });
    }

    if (Array.isArray(target)) {
      return target.map(item => this.resolve(item, dataStore));
    }

    if (typeof target === 'object') {
      const resolved = {};
      for (const [k, v] of Object.entries(target)) {
        resolved[k] = this.resolve(v, dataStore);
      }
      return resolved;
    }

    return target;
  }

  static _getValue(path, obj) {
    // Support nested paths like 'top_3_news[0].link'
    try {
      const parts = path.replace(/\]/g, '').split(/[.\[]/);
      let current = obj;
      for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        // If we hit a metadata object, try to get the primary value
        if (current[part] === undefined && current.value !== undefined) {
           current = current.value;
        }
        current = current[part];
      }
      // If the final result is a metadata object, return its primary value
      if (current && typeof current === 'object' && current.path) return current.path;
      if (current && typeof current === 'object' && current.value) return current.value;
      
      return current;
    } catch (e) {
      return undefined;
    }
  }
}
