import { ConfigService } from '../config_service.js';
import net from 'net';

export class AppiumService {
  static async getServerUrl() {
    const config = await ConfigService.load().catch(() => ({}));
    return config.automation?.appium?.serverUrl || 'http://localhost:4723';
  }

  static async isServerRunning() {
    const url = await this.getServerUrl();
    const parsed = new URL(url);
    const port = parseInt(parsed.port) || 4723;
    const hostname = parsed.hostname || '127.0.0.1';

    return new Promise((resolve) => {
      const socket = net.connect(port, hostname);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        resolve(false);
      });
    });
  }

  static async getMergedCapabilities(customCaps = {}) {
    const config = await ConfigService.load().catch(() => ({}));
    const defaultCaps = config.automation?.appium?.defaultCapabilities || {};
    return { ...defaultCaps, ...customCaps };
  }
}
