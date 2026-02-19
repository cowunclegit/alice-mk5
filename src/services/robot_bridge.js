import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { BrowserService } from './browser_service.js';

export class RobotBridge {
  static async runSequence(actions, stepNumber = 1, sessionId = 'unknown', selectedResources = ['core.resource']) {
    const sessionDir = path.join(process.cwd(), 'tmp_robot', `session-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });

    // Node.js launches the browser once and keeps it alive
    const debugPort = await BrowserService.startBrowser(sessionId);
    
    const robotFile = path.join(sessionDir, `step-${stepNumber}.robot`);
    const varsFile = path.join(sessionDir, `vars-${stepNumber}.py`);
    
    const resourceDir = path.join(process.cwd(), 'src/robots/resources');
    const resourceSettings = selectedResources
      .map(r => `Resource    ${path.join(resourceDir, r)}`)
      .join('\n');
    
    let testSteps = '';
    
    // Every Robot step ALWAYS starts by connecting to the persistent browser
    testSteps += `    Connect To Existing Browser\n`;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const { keyword, args = [] } = action;
      
      // If the LLM generates Open Visible Browser, we replace it with navigation 
      // because the browser is ALREADY open and attached.
      if (keyword === 'Open Visible Browser') {
        const url = args[0] || 'about:blank';
        testSteps += `    Navigate To URL    ${url}\n`;
        continue;
      }

      const safeArgs = Array.isArray(args) ? args.filter(a => a !== null && a !== undefined && a !== '') : [];
      const escapedArgs = safeArgs.map(arg => {
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
Step ${stepNumber} Execution
${testSteps}
`;

    const varsContent = `
SESSION_ID = "${sessionId}"
DEBUG_PORT = ${debugPort}
`;

    await fs.writeFile(varsFile, varsContent);
    await fs.writeFile(robotFile, content);

    return new Promise((resolve) => {
      const outputDir = path.join(sessionDir, `logs-step-${stepNumber}`);
      const robotProcess = spawn('robot', ['--outputdir', outputDir, robotFile]);
      let stdout = '';
      let stderr = '';

      robotProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      robotProcess.stderr.on('data', (data) => { stderr += data.toString(); });

      robotProcess.on('close', (code) => {
        resolve({
          status: code === 0 ? 'pass' : 'fail',
          stdout,
          stderr,
          tempDir: outputDir
        });
      });
    });
  }

  static async runKeyword(keyword, args = [], sessionId = 'unknown', selectedResources = ['core.resource']) {
    return this.runSequence([{ keyword, args }], 1, sessionId, selectedResources);
  }
}
