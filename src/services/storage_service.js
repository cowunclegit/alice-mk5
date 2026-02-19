import fs from 'fs/promises';
import path from 'path';

export class StorageService {
  static baseDir = path.join(process.cwd(), 'src/memory');
  static toolsDir = path.join(process.cwd(), 'src/robots/tools');
  static resultsDir = path.join(process.cwd(), 'src/memory/data');
  static snapshotsDir = path.join(process.cwd(), 'src/memory/snapshots');

  static async init(config = {}) {
    if (config.resultsDir) {
      this.resultsDir = path.isAbsolute(config.resultsDir) 
        ? config.resultsDir 
        : path.join(process.cwd(), config.resultsDir);
    }
    await fs.mkdir(this.resultsDir, { recursive: true });
    await fs.mkdir(this.toolsDir, { recursive: true });
    await fs.mkdir(this.snapshotsDir, { recursive: true });
  }

  static async saveSequence(sequence) {
    const filePath = path.join(this.toolsDir, `${sequence.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(sequence, null, 2));
  }

  static async loadSequence(id) {
    const filePath = path.join(this.toolsDir, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  static async saveSnapshot(sessionId, step, data) {
    const sessionDir = path.join(this.snapshotsDir, `session-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });
    const filePath = path.join(sessionDir, `step-${step}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
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
