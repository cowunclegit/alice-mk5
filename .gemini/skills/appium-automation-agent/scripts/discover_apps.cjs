const { execSync } = require('child_process');
const os = require('os');

function discoverApps() {
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

if (require.main === module) {
  const apps = discoverApps();
  console.log(JSON.stringify(apps, null, 2));
}

module.exports = { discoverApps };
