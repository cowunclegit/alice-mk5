import os from 'os';

/**
 * ValidationService for environment and variable integrity checks.
 */
export class ValidationService {
  /**
   * Captures current environment metadata.
   */
  static async captureEnvMetadata() {
    return {
      os: process.platform,
      arch: process.arch,
      node_version: process.version,
      resolution: null, // To be filled by Robot Framework during execution if possible
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validates tool manifest against current environment.
   * 
   * @param {Object} manifestEnv - Environment metadata from manifest
   * @throws {Error} If critical mismatch found
   */
  static validateEnvironment(manifestEnv) {
    if (!manifestEnv) return;

    if (manifestEnv.os && manifestEnv.os !== process.platform) {
      throw new Error(`Environment Mismatch: Tool was created on ${manifestEnv.os} but current OS is ${process.platform}.`);
    }
    
    // We can add more strict checks here if needed, or just warn
  }

  /**
   * Validates presence of all required variables.
   * 
   * @param {Object} manifestVariables - Variable definitions from manifest
   * @param {Object} inputVariables - User provided variables
   * @throws {Error} If required variable is missing
   */
  static validateVariables(manifestVariables = [], inputVariables = {}) {
    const missing = [];
    
    for (const v of manifestVariables) {
      if (v.required && inputVariables[v.name] === undefined) {
        missing.push(v.name);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }
  }
}
