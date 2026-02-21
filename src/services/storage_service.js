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

  static async saveToolSnapshot(manifest, scripts = []) {
    const toolId = manifest.id;
    const platform = manifest.platform || 'web';
    const toolDir = path.join(this.toolsDir, platform, toolId);
    
    await fs.mkdir(toolDir, { recursive: true });
    
    // 1. Save Manifest
    const manifestPath = path.join(toolDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    // 2. Copy scripts
    for (const scriptPath of scripts) {
      const fileName = path.basename(scriptPath);
      const destPath = path.join(toolDir, fileName);
      await fs.copyFile(scriptPath, destPath);
    }
    
    // 3. Update Catalog
    await this.updateCatalog(manifest);
    
    return toolDir;
  }

  static async updateCatalog(manifest) {
    let catalog = { tools: [], last_updated: new Date().toISOString() };
    try {
      const content = await fs.readFile(this.catalogPath, 'utf8');
      catalog = JSON.parse(content);
    } catch (e) {}
    
    const existingIndex = catalog.tools.findIndex(t => t.id === manifest.id);
    const summary = {
      id: manifest.id,
      title: manifest.title,
      description: manifest.description,
      platform: manifest.platform,
      version: manifest.version,
      last_updated: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      catalog.tools[existingIndex] = summary;
    } else {
      catalog.tools.push(summary);
    }
    
    catalog.last_updated = new Date().toISOString();
    await fs.writeFile(this.catalogPath, JSON.stringify(catalog, null, 2));
  }

  static async loadToolManifest(toolId, platform = 'web') {
    const manifestPath = path.join(this.toolsDir, platform, toolId, 'manifest.json');
    const content = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(content);
  }

  static async recordToolExecution(toolId, input, status, lastResult = null) {
    const historyDir = path.join(this.baseDir, 'tools_history');
    await fs.mkdir(historyDir, { recursive: true });
    
    const entry = {
      toolId,
      input,
      status,
      timestamp: new Date().toISOString(),
      lastResult
    };
    
    const fileName = `${toolId}_${new Date().getTime()}.json`;
    await fs.writeFile(path.join(historyDir, fileName), JSON.stringify(entry, null, 2));
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
