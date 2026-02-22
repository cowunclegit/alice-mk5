import fs from 'fs/promises';
import path from 'path';

export class StorageService {
  static baseDir = path.join(process.cwd(), 'src/memory');
  static toolsDir = path.join(process.cwd(), 'src/robots/tools');
  static resultsDir = path.join(process.cwd(), 'src/memory/data');
  static catalogPath = path.join(process.cwd(), 'src/memory/tools/catalog.json');

  static async init(config = {}) {
    if (config.resultsDir) {
      this.resultsDir = path.isAbsolute(config.resultsDir) 
        ? config.resultsDir 
        : path.join(process.cwd(), config.resultsDir);
    }
    await fs.mkdir(this.resultsDir, { recursive: true });
    await fs.mkdir(path.join(this.toolsDir, 'web'), { recursive: true });
    await fs.mkdir(path.join(this.toolsDir, 'application'), { recursive: true });
    await fs.mkdir(path.join(this.toolsDir, 'cross-platform'), { recursive: true });
    
    // Ensure catalog exists
    try {
      await fs.access(this.catalogPath);
    } catch (e) {
      await fs.mkdir(path.dirname(this.catalogPath), { recursive: true });
      await fs.writeFile(this.catalogPath, JSON.stringify({ tools: [], last_updated: new Date().toISOString() }, null, 2));
    }
  }

  static async updateCatalog(manifest) {
    // No longer used, but keeping stub for now if needed by other logic
  }

  static async loadToolManifest(toolId, platform = 'web') {
    // No longer used
  }

  static async recordToolExecution(toolId, input, status, lastResult = null) {
    // No longer used
  }

  static async saveSequence(sequence, platform = 'web') {
    const dir = path.join(this.toolsDir, platform);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${sequence.id}.json`);
    await fs.writeFile(filePath, JSON.stringify({ ...sequence, platform }, null, 2));
  }

  static async loadSequence(id, platform = 'web') {
    const filePath = path.join(this.toolsDir, platform, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  static async listTools(platform = 'web') {
    const dir = path.join(this.toolsDir, platform);
    try {
      const files = await fs.readdir(dir);
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch (e) {
      return [];
    }
  }

  /**
   * Moves a file to the results directory with a unique timestamped name.
   * Format: [toolId]_[timestamp]_[originalName]
   */
  static async finalizeResult(tempFilePath, originalFilename, toolId = 'dynamic') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalFilename = `${toolId}_${timestamp}_${originalFilename}`;
    const finalPath = path.join(this.resultsDir, finalFilename);
    
    await fs.copyFile(tempFilePath, finalPath);
    return finalPath;
  }

  static async cleanOldLogs(limit) {
    const dir = path.join(this.baseDir, 'logs');
    try {
      const files = await fs.readdir(dir);
      if (files.length > limit) {
        const sorted = await Promise.all(
          files.map(async f => ({
            name: f,
            time: (await fs.stat(path.join(dir, f))).mtime.getTime()
          }))
        );
        sorted.sort((a, b) => a.time - b.time);
        
        const toDelete = sorted.slice(0, sorted.length - limit);
        for (const file of toDelete) {
          await fs.unlink(path.join(dir, file.name));
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
