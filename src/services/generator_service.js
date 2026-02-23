import fs from 'fs/promises';
import path from 'path';

export class GeneratorService {
  constructor(baseDir = 'src/robots/resources/web') {
    this.baseDir = path.isAbsolute(baseDir) ? baseDir : path.join(process.cwd(), baseDir);
  }

  generateKeyword(intent, selector, args = []) {
    // Basic title-case naming
    const name = intent
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    const argList = args.map((_, i) => `\$\{arg${i + 1}\}`).join('    ');
    
    let steps = '';
    if (selector) {
      if (args.length > 0) {
        steps = `    Type Into Element    ${selector}    \$\{arg1\}`;
      } else {
        steps = `    Click Element    ${selector}`;
      }
    }

    return `${name}\n    [Arguments]    ${argList}\n${steps}\n`;
  }

  async updateResourceFile(domain, keywordName, content) {
    const filePath = path.join(this.baseDir, `${domain}.resource`);
    let fileContent = '';

    try {
      fileContent = await fs.readFile(filePath, 'utf8');
    } catch (e) {
      fileContent = `*** Settings ***\nResource    ./core.resource\n\n*** Keywords ***\n`;
    }

    const lines = fileContent.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === keywordName) {
        startIndex = i;
        // Find next non-indented line or end of file
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() !== '' && !lines[j].startsWith(' ')) {
            endIndex = j;
            break;
          }
        }
        if (endIndex === -1) endIndex = lines.length;
        break;
      }
    }

    if (startIndex !== -1) {
      // Replace existing
      lines.splice(startIndex, endIndex - startIndex, keywordName, content.trimEnd());
    } else {
      // Append new
      lines.push(keywordName, content.trimEnd(), '');
    }

    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(filePath, lines.join('\n'));
  }

  async removeKeyword(domain, keywordName) {
    const filePath = path.join(this.baseDir, `${domain}.resource`);
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const lines = fileContent.split('\n');
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === keywordName) {
          startIndex = i;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() !== '' && !lines[j].startsWith(' ')) {
              endIndex = j;
              break;
            }
          }
          if (endIndex === -1) endIndex = lines.length;
          break;
        }
      }

      if (startIndex !== -1) {
        lines.splice(startIndex, endIndex - startIndex);
        await fs.writeFile(filePath, lines.join('\n'));
      }
    } catch (e) {
      // Ignore if file doesn't exist
    }
  }
}
