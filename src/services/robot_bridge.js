import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class RobotBridge {
  static async runSequence(actions, stepNumber = 1, sessionId = 'unknown') {
    const sessionDir = path.join(process.cwd(), 'tmp_robot', `session-${sessionId}`);
    await fs.mkdir(sessionDir, { recursive: true });
    
    const robotFile = path.join(sessionDir, `step-${stepNumber}.robot`);
    
    let testSteps = '';
    for (const action of actions) {
      const { keyword, args = [] } = action;
      
      // Filter out null/undefined/empty string arguments
      const safeArgs = Array.isArray(args) ? args.filter(a => a !== null && a !== undefined && a !== '') : [];
      
      // CRITICAL: Robot Framework requires 2+ spaces (using 4 for safety) to separate keyword and each argument.
      const argsStr = safeArgs.length > 0 
        ? '    ' + safeArgs.join('    ') 
        : '';
        
      testSteps += `    ${keyword}${argsStr}\n`;
    }

    const content = `
*** Settings ***
Resource    ${path.join(process.cwd(), 'src/robots/core.resource')}

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
