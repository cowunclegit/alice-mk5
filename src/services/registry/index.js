import { execSync } from 'child_process';
import os from 'os';

export class RegistryService {
  static async discoverApps() {
    const platform = os.platform();
    const results = [];

    try {
      if (platform === 'darwin') {
        // macOS: Use system_profiler
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
        // Windows: Query registry via PowerShell
        const psCommand = `Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\* | Select-Object DisplayName, InstallLocation, DisplayIcon | ConvertTo-Json`;
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
    
    // Fuzzy match: check if name contains or is contained in appName
    const match = apps.find(app => {
      const normalizedName = app.name.toLowerCase().normalize('NFC');
      return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
    });

    if (!match) return null;

    const platform = os.platform();
    return {
      platformName: platform === 'darwin' ? 'macOS' : 'Windows',
      app: platform === 'darwin' ? (match.identifier || match.path) : match.path,
      automationName: platform === 'darwin' ? 'Mac2' : 'Windows',
      deviceName: os.hostname()
    };
  }
}
