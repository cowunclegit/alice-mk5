import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class RobotBridge {
  static async runSequence(actions, stepNumber = 1, sessionId = 'unknown') {
    const sessionDir = path.join(process.cwd(), 'tmp_robot', `session-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });
    
    const robotFile = path.join(sessionDir, `step-${stepNumber}.robot`);
    
    // Find all resources in the new consolidated directory
    const resourceDir = path.join(process.cwd(), 'src/robots/resources');
    let allResources = [];
    try {
      const files = await fs.readdir(resourceDir);
      // Ensure core.resource is loaded first or explicitly, 
      // but here we just load everything in that folder.
      allResources = files.filter(f => f.endsWith('.resource')).map(f => path.join(resourceDir, f));
    } catch (e) {
      // ignore
    }

    const resourceSettings = allResources.map(r => `Resource    ${r}`).join('\n');
    
    let testSteps = '';
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const { keyword, args = [] } = action;
      
      const safeArgs = Array.isArray(args) ? args.filter(a => a !== null && a !== undefined && a !== '') : [];
      
      const escapedArgs = safeArgs.map(arg => {
        if (typeof arg === 'string' && arg.startsWith('#')) {
          return `\\${arg}`;
        }
        return arg;
      });
      
      const argsStr = escapedArgs.length > 0 ? '    ' + escapedArgs.join('    ') : '';
      testSteps += `    ${keyword}${argsStr}\n`;

      if (i < actions.length - 1) {
        const delay = (Math.random() * (2.0 - 0.5) + 0.5).toFixed(2);
        testSteps += `    Sleep    ${delay}s\n`;
      }
    }

    testSteps += `    Sleep    2s\n`;

    const content = `
*** Settings ***
${resourceSettings}

*** Test Cases ***
Step ${stepNumber} Execution
${testSteps}
`;

    await fs.writeFile(robotFile, content);

    return new Promise((resolve) => {
      const outputDir = path.join(sessionDir, `logs-step-${stepNumber}`);
      const robotProcess = spawn('robot', ['--outputdir', outputDir, robotFile]);
      let stdout = '';
      let stderr = '';

      robotProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      robotProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

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

  static async runKeyword(keyword, args = []) {
    return this.runSequence([{ keyword, args }]);
  }
}
