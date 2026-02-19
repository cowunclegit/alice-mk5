import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import net from 'net';
import { ConfigService } from './config_service.js';

export class BrowserService {
  static processes = new Map();

  static async findChromePath() {
    const platform = os.platform();
    
    if (platform === 'darwin') {
      const macPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
      ];
      for (const p of macPaths) {
        try { await fs.access(p); return p; } catch (e) {}
      }
    } else if (platform === 'win32') {
      const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
      const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
      
      const winPaths = [
        path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
        path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      ];
      for (const p of winPaths) {
        try { await fs.access(p); return p; } catch (e) {}
      }
    } else if (platform === 'linux') {
      const linuxBinaries = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'brave-browser'];
      for (const bin of linuxBinaries) {
        try {
          const { execSync } = await import('child_process');
          const p = execSync(`which ${bin}`).toString().trim();
          if (p) return p;
        } catch (e) {}
      }
    }
    
    return 'google-chrome';
  }

  static async isPortOpen(port) {
    return new Promise((resolve) => {
      const socket = net.connect(port, '127.0.0.1');
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        resolve(false);
      });
    });
  }

  static async startBrowser(sessionId) {
    if (this.processes.has(sessionId)) {
      const session = this.processes.get(sessionId);
      if (await this.isPortOpen(session.port)) {
        return session.port;
      }
      // Process might have died, clean up
      this.processes.delete(sessionId);
    }

    const config = await ConfigService.load().catch(() => ({}));
    
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
        hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
        hash |= 0; 
    }
    const debugPort = 9000 + (Math.abs(hash) % 1000);
    const profileDir = path.join(process.cwd(), 'browser', 'profiles', sessionId);
    await fs.mkdir(profileDir, { recursive: true });

    const chromePath = await this.findChromePath();
    
    const args = [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      '--disable-blink-features=AutomationControlled',
      'about:blank'
    ];

    if (config.automation?.headless) {
      args.push('--headless=new');
    }

    const browserProcess = spawn(chromePath, args, {
      detached: true,
      stdio: 'ignore'
    });

    browserProcess.unref();

    this.processes.set(sessionId, {
      process: browserProcess,
      port: debugPort
    });

    // Wait for browser to be READY
    let attempts = 0;
    while (attempts < 10) {
      if (await this.isPortOpen(debugPort)) {
        return debugPort;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    throw new Error(`Failed to start browser on port ${debugPort} after 5 seconds.`);
  }

  static async stopBrowser(sessionId) {
    const session = this.processes.get(sessionId);
    if (session) {
      try {
        session.process.kill();
      } catch (e) {}
      this.processes.delete(sessionId);
    }
  }
}
