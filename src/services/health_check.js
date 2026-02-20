import net from 'net';
import { ConfigService } from './config_service.js';

export class HealthCheckService {
  static async isPortOpen(port, host = '127.0.0.1', timeoutMs = 2000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let status = false;

      socket.setTimeout(timeoutMs);
      socket.on('connect', () => {
        status = true;
        socket.destroy();
      });
      socket.on('timeout', () => {
        socket.destroy();
      });
      socket.on('error', () => {
        socket.destroy();
      });
      socket.on('close', () => {
        resolve(status);
      });

      socket.connect(port, host);
    });
  }

  static async probeResources(tasks, sessionId) {
    const config = await ConfigService.load().catch(() => ({}));
    const results = new Map();

    const needsWeb = tasks.some(t => t.platform === 'web');
    const needsApp = tasks.some(t => t.platform === 'application');

    if (needsWeb) {
      // Calculate debug port same as BrowserService
      let hash = 0;
      for (let i = 0; i < sessionId.length; i++) {
          hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
          hash |= 0; 
      }
      const debugPort = 9000 + (Math.abs(hash) % 1000);
      const isOpen = await this.isPortOpen(debugPort);
      results.set('browser', isOpen);
    }

    if (needsApp) {
      const appiumUrl = config.automation?.appium?.serverUrl || 'http://localhost:4723';
      const url = new URL(appiumUrl);
      const isOpen = await this.isPortOpen(parseInt(url.port) || 4723, url.hostname || '127.0.0.1');
      results.set('appium', isOpen);
    }

    return results;
  }
}
