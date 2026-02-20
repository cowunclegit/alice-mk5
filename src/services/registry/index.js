import { execSync } from 'child_process';
import os from 'os';

export class RegistryService {
  static async discoverApps() {
    const platform = os.platform();
    const results = [];

    try {
      if (platform === 'darwin') {
        const output = execSync('system_profiler SPApplicationsDataType -json', { encoding: 'utf8' });
        const data = JSON.parse(output);
        const apps = data.SPApplicationsDataType || [];
        for (const app of apps) {
          results.push({
            name: app._name,
            identifier: app.bundle_id || '',
            path: app.path
          });
        }
      } else if (platform === 'win32') {
        const psCommand = `Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, InstallLocation, DisplayIcon | ConvertTo-Json`;
        const output = execSync(`powershell -Command "${psCommand}"`, { encoding: 'utf8' });
        const data = JSON.parse(output);
        const apps = Array.isArray(data) ? data : [data];
        for (const app of apps) {
          if (app.DisplayName) {
            results.push({
              name: app.DisplayName,
              identifier: app.DisplayIcon || '',
              path: app.InstallLocation || ''
            });
          }
        }
      }
    } catch (e) {
      console.error(`Error discovering apps: ${e.message}`);
    }

    return results;
  }

  static async getAppCapabilities(appName) {
    const apps = await this.discoverApps();
    const normalizedSearch = appName.toLowerCase().normalize('NFC');
    
    const match = apps.find(app => {
      const normalizedName = app.name.toLowerCase().normalize('NFC');
      return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
    });

    if (!match) return null;

    const platform = os.platform();
    
    // Hardcoded fallback for common macOS system apps if identifier is missing
    let bundleId = match.identifier;
    if (platform === 'darwin' && !bundleId) {
      if (match.name.includes('계산기') || match.name.toLowerCase().includes('calculator')) {
        bundleId = 'com.apple.calculator';
      }
    }

    return {
      platformName: platform === 'darwin' ? 'Mac' : 'Windows',
      // For macOS, bundleId is much more reliable
      app: platform === 'darwin' ? (bundleId || match.path) : match.path,
      automationName: platform === 'darwin' ? 'Mac2' : 'Windows',
      deviceName: 'Mac',
      'appium:bundleId': platform === 'darwin' ? bundleId : undefined,
      'appium:showServerLogs': true,
      'appium:serverConnectTimeout': 90000,
      'appium:noReset': true,
      'appium:forceAppLaunch': true,
      'appium:waitForQuiescence': false // Don't wait for app to be idle, might help with 500 error
    };
  }
}
