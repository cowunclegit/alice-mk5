import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';
import { RobotParser } from '../lib/robot_parser.js';

const execAsync = promisify(exec);

export class ResourceService {
  static resourcesDir = path.join(process.cwd(), 'src/robots/resources');
  static backupDir = path.join(process.cwd(), 'src/robots/resources/backups');
  static manifestsPath = path.join(process.cwd(), 'src/robots/resources/manifests.json');

  /**
   * Indexes all .resource files in the resources directory.
   * @returns {Promise<Array>} List of resource file metadata and their keywords.
   */
  static async indexResources() {
    const results = [];
    const files = await this._walkDir(this.resourcesDir);
    
    for (const file of files) {
      if (file.endsWith('.resource')) {
        const content = await fs.readFile(file, 'utf8');
        const keywords = RobotParser.parseKeywords(content);
        const relativePath = path.relative(process.cwd(), file);
        
        results.push({
          filePath: file,
          relativePath,
          isCore: path.basename(file) === 'core.resource',
          keywords: keywords.map(k => ({
            name: k.name,
            arguments: k.args
          }))
        });
      }
    }
    return results;
  }

  /**
   * Creates a backup of a file.
   * @param {string} filePath 
   */
  static async createBackup(filePath) {
    await fs.mkdir(this.backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupPath = path.join(this.backupDir, `${fileName}.${timestamp}.bak`);
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  }

  /**
   * Performs a syntax check using robot --dryrun.
   * @param {string} filePath - Path to the resource file.
   * @throws {Error} If validation fails.
   */
  static async validateResource(filePath) {
    const tempTestFile = path.join(process.cwd(), 'src/memory/temp_validation.robot');
    const testContent = `
*** Settings ***
Resource    ${filePath}

*** Test Cases ***
Validation Test
    No Operation
`;
    await fs.writeFile(tempTestFile, testContent);
    
    try {
      // Use --dryrun to check syntax without execution
      await execAsync(`robot --dryrun --outputdir src/memory/logs ${tempTestFile}`);
    } catch (error) {
      throw new Error(`Robot Framework Syntax Error: ${error.stdout || error.message}`);
    } finally {
      await fs.unlink(tempTestFile).catch(() => {});
    }
  }

  /**
   * Recursively walks a directory to find all files.
   */
  static async _walkDir(dir) {
    let files = [];
    const list = await fs.readdir(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory() && item !== 'backups') {
        files = files.concat(await this._walkDir(fullPath));
      } else if (stats.isFile()) {
        files.push(fullPath);
      }
    }
    return files;
  }

  /**
   * Updates the manifests.json with new synonyms for a specific resource file.
   */
  static async updateManifest(filePath, synonyms = []) {
    let manifest = { mappings: {} };
    try {
      const data = await fs.readFile(this.manifestsPath, 'utf8');
      manifest = JSON.parse(data);
    } catch (e) {}

    if (!manifest.mappings) manifest.mappings = {};
    
    // Normalize path to be relative to resourcesDir (e.g., "custom/naver_weather.resource")
    const relativeToResources = path.relative(this.resourcesDir, filePath);
    
    console.log(`[ResourceService] Updating manifest for: ${relativeToResources} with synonyms: ${synonyms.join(', ')}`);
    
    manifest.mappings[relativeToResources] = Array.from(new Set([...(manifest.mappings[relativeToResources] || []), ...synonyms]));
    
    await fs.writeFile(this.manifestsPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Simplifies HTML to a map of potential interactive elements.
   * Helps LLM find selectors without processing MBs of HTML.
   */
  static simplifyHtml(html) {
    const $ = cheerio.load(html);
    const elements = [];

    $('a, button, input, span, strong, div').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const id = $el.attr('id');
      const className = $el.attr('class');
      
      if (text.length > 0 && text.length < 100) {
        elements.push({
          tag: el.name,
          text,
          id: id ? `#${id}` : null,
          class: className ? `.${className.split(' ').join('.')}` : null,
          path: this._getSelector($, el)
        });
      }
    });

    return elements.slice(0, 100); // Limit to top 100 interesting elements
  }

  static _getSelector($, el) {
    const path = [];
    $(el).parents().addBack().each((i, e) => {
      let entry = e.name;
      if (e.attribs.id) {
        entry += '#' + e.attribs.id;
      } else if (e.attribs.class) {
        entry += '.' + e.attribs.class.split(/\s+/).filter(c => c).join('.');
      } else {
        const index = $(e).prevAll(e.name).length + 1;
        if (index > 1) entry += `:nth-of-type(${index})`;
      }
      path.push(entry);
    });
    return path.join(' > ');
  }
}
