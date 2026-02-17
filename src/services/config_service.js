import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export class ConfigService {
  static async load() {
    const configPath = path.join(process.cwd(), 'config.yaml');
    const fileContent = await fs.readFile(configPath, 'utf8');
    return yaml.load(fileContent);
  }
}
