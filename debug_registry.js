import { RegistryService } from './src/services/registry/index.js';

const run = async () => {
  const apps = await RegistryService.discoverApps();
  console.log(`Found ${apps.length} apps.`);
  const calc = apps.find(a => a.name.toLowerCase().includes('calc'));
  console.log('Calculator search result:', calc);
  
  if (apps.length > 0) {
    console.log('Sample app:', apps[0]);
  }
};

run().catch(console.error);
