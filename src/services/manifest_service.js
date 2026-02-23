import fs from 'fs/promises';
import path from 'path';

export class ManifestService {
  constructor(baseDir = 'src/robots/resources/web') {
    this.baseDir = path.isAbsolute(baseDir) ? baseDir : path.join(process.cwd(), baseDir);
    this.manifestPath = path.join(this.baseDir, 'manifests.json');
  }

  async _load() {
    try {
      const data = await fs.readFile(this.manifestPath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return { mappings: {} };
    }
  }

  async _save(manifest) {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  async sync() {
    const manifest = await this._load();
    const files = await fs.readdir(this.baseDir);
    const resourceFiles = files.filter(f => f.endsWith('.resource'));
    
    const newMappings = {};
    
    // Keep existing aliases if file still exists
    for (const file of resourceFiles) {
      const key = `web/${file}`;
      newMappings[key] = manifest.mappings[key] || [file.replace('.resource', '')];
    }

    await this._save({ mappings: newMappings });
  }

  async addMapping(resourcePath, aliases) {
    const manifest = await this._load();
    // Ensure aliases are unique
    const uniqueAliases = [...new Set(aliases)];
    manifest.mappings[resourcePath] = uniqueAliases;
    await this._save(manifest);
  }

  async getMappings() {
    const manifest = await this._load();
    return manifest.mappings;
  }
}
