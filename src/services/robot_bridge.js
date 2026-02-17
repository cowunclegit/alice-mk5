import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class RobotBridge {
  static async runKeyword(keyword, args = []) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'robot-'));
    const robotFile = path.join(tempDir, 'task.robot');
    
    const argsStr = args.map(arg => {
      if (typeof arg === 'string') {
        return `    ${arg}`;
      }
      return `    ${JSON.stringify(arg)}`;
    }).join('');

    const content = `
*** Settings ***
Resource    ${path.join(process.cwd(), 'src/robots/core.resource')}

*** Test Cases ***
Execute Dynamic Keyword
    ${keyword}${argsStr}
`;

    await fs.writeFile(robotFile, content);

    // Human-like delay
    const delay = Math.random() * (2000 - 500) + 500; // 0.5s to 2.0s
    await new Promise(resolve => setTimeout(resolve, delay));

    return new Promise((resolve, reject) => {
      const robotProcess = spawn('robot', ['--outputdir', tempDir, robotFile]);
      let stdout = '';
      let stderr = '';

      robotProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      robotProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      robotProcess.on('close', (code) => {
        const result = {
          status: code === 0 ? 'pass' : 'fail',
          stdout,
          stderr,
          tempDir
        };
        resolve(result);
      });
    });
  }
}
