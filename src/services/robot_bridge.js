import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { BrowserService } from './browser_service.js';

export class RobotBridge {
  static async runSequence(actions, stepLabel = '1', sessionId = 'unknown', selectedResources = ['core.resource'], logger = null, dataStore = {}) {
    const sessionDir = path.join(process.cwd(), 'tmp_robot', `session-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });

    const isAppTask = selectedResources.some(r => r.includes('application'));
    let debugPort = 0;

    if (!isAppTask) {
      debugPort = await BrowserService.startBrowser(sessionId);
    }
    
    const robotFile = path.join(sessionDir, `step-${stepLabel}.robot`);
    const varsFile = path.join(sessionDir, `vars-${stepLabel}.py`);
    
    const baseResourceDir = path.join(process.cwd(), 'src/robots/resources');
    const resourceSettings = selectedResources
      .map(r => {
        const fullPath = path.isAbsolute(r) ? r : path.join(baseResourceDir, r);
        return `Resource    ${fullPath}`;
      })
      .join('\n');
    
    let testSteps = '';
    
    if (!isAppTask) {
      testSteps += `    Connect To Existing Browser\n`;
    }

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      let { keyword, args = [] } = action;
      
      if (keyword.includes('.')) {
        const parts = keyword.split('.');
        keyword = parts[parts.length - 1];
      }

      if (!isAppTask && keyword === 'Open Visible Browser') {
        const url = args[0] || 'about:blank';
        testSteps += `    Navigate To URL    ${url}\n`;
        continue;
      }

      const safeArgs = Array.isArray(args) ? args.filter(a => a !== null && a !== undefined && a !== '') : [];
      
      // Resolve dataStore references in args
      const resolvedArgs = safeArgs.map(arg => {
        if (typeof arg === 'string' && (arg.includes('dataStore') || (arg.startsWith('{{') && arg.endsWith('}}')) || (arg.includes('${dataStore')))) {
          try {
            // Normalize path: remove dataStore prefix and quotes/brackets
            let path = arg;
            if (arg.startsWith('{{')) {
              path = arg.substring(2, arg.length - 2);
            } else if (arg.includes('${dataStore')) {
              const match = arg.match(/\${dataStore\['?(.*?)'?\]}/) || arg.match(/\${dataStore\.(.*?)}/);
              if (match) path = match[1];
            }
            
            path = path.replace('dataStore', '')
                      .replace(/\[['"]/g, '.')
                      .replace(/['"]\]/g, '')
                      .replace(/^\./, '');
            
            const parts = path.split('.').filter(p => p !== '');
            let val = dataStore;
            for (const part of parts) {
              if (val === undefined || val === null) break;
              val = val[part];
            }
            if (val !== undefined && val !== null) {
              let result = (typeof val === 'object') ? JSON.stringify(val) : String(val);
              // Clean up: trim and remove surrounding quotes if they were mistakenly added
              result = result.trim().replace(/^["'](.*)["']$/, '$1');
              return result;
            }
          } catch (e) {
            if (logger) logger.warn(`RobotBridge: Failed to resolve arg "${arg}": ${e.message}`);
          }
        }
        return arg;
      });

      const escapedArgs = resolvedArgs.map(arg => {
        if (typeof arg === 'string' && arg.startsWith('#')) return `\\${arg}`;
        return arg;
      });
      
      const argsStr = escapedArgs.length > 0 ? '    ' + escapedArgs.join('    ') : '';
      testSteps += `    ${keyword}${argsStr}\n`;

      if (i < actions.length - 1) {
        const delay = (Math.random() * (2.0 - 0.5) + 0.5).toFixed(2);
        testSteps += `    Sleep    ${delay}s\n`;
      }
    }

    testSteps += `    Sleep    5s\n`;

    const content = `
*** Settings ***
${resourceSettings}
Variables    ${varsFile}

*** Test Cases ***
Step ${stepLabel} Execution
${testSteps}
`;

    const varsContent = `
SESSION_ID = "${sessionId}"
DEBUG_PORT = ${debugPort}
`;

    await fs.writeFile(varsFile, varsContent);
    await fs.writeFile(robotFile, content);

    return new Promise((resolve) => {
      const outputDir = path.join(sessionDir, `logs-step-${stepLabel}`);
      const robotProcess = spawn('robot', ['--outputdir', outputDir, robotFile]);
      let stdout = '';
      let stderr = '';

      robotProcess.stdout.on('data', (data) => { 
        const line = data.toString();
        stdout += line;
        if (logger) {
          logger.debug(`[Robot] [${stepLabel}] ${line.trim()}`);
        }
      });
      
      robotProcess.stderr.on('data', (data) => { 
        const line = data.toString();
        stderr += line;
        if (logger) {
          logger.error(`[Robot Error] [${stepLabel}] ${line.trim()}`);
        }
      });

      robotProcess.on('close', (code) => {
        // Extract saved file path from stdout if present
        let savedPath = null;
        const pathMatch = stdout.match(/SAVED_FILE_PATH: (.*)/);
        if (pathMatch && pathMatch[1]) {
          savedPath = pathMatch[1].trim();
        }

        resolve({
          status: code === 0 ? 'pass' : 'fail',
          stdout,
          stderr,
          tempDir: outputDir,
          robotFile,
          varsFile,
          savedFilePath: savedPath
        });
      });
    });
  }

  static async runKeyword(keyword, args = [], sessionId = 'unknown', selectedResources = ['core.resource'], logger = null, stepLabel = '1', dataStore = {}) {
    return this.runSequence([{ keyword, args }], stepLabel, sessionId, selectedResources, logger, dataStore);
  }
}
