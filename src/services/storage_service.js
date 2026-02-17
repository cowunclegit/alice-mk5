import fs from 'fs/promises';
import path from 'path';

export class StorageService {
  static baseDir = path.join(process.cwd(), 'src/memory');

  static async saveSequence(sequence) {
    const dir = path.join(this.baseDir, 'sequences');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${sequence.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(sequence, null, 2));
  }

  static async loadSequence(id) {
    const filePath = path.join(this.baseDir, 'sequences', `${id}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  static async saveData(key, data) {
    const dir = path.join(this.baseDir, 'data');
    await fs.mkdir(dir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(dir, `${key}-${timestamp}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  static async cleanOldLogs(limit) {
    const dir = path.join(this.baseDir, 'logs');
    try {
      const files = await fs.readdir(dir);
      if (files.length > limit) {
        const sorted = files.map(f => ({
          name: f,
          time: fs.stat(path.join(dir, f)).then(s => s.mtime.getTime())
        }));
        const resolved = await Promise.all(sorted.map(async s => ({ ...s, time: await s.time })));
        resolved.sort((a, b) => a.time - b.time);
        
        const toDelete = resolved.slice(0, resolved.length - limit);
        for (const file of toDelete) {
          await fs.unlink(path.join(dir, file));
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
