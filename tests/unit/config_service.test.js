import { ConfigService } from '../../src/services/config_service.js';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

describe('ConfigService', () => {
  const configPath = path.join(process.cwd(), 'config.yaml');

  beforeAll(async () => {
    const testConfig = {
      llm: {
        apiKey: 'test-key',
        model: 'gemini-2.0-flash'
      },
      automation: {
        browser: 'chromium',
        headless: false
      }
    };
    await fs.writeFile(configPath, yaml.dump(testConfig));
  });

  afterAll(async () => {
    try {
      await fs.unlink(configPath);
    } catch (e) {
      // ignore
    }
  });

  it('should load config from yaml file', async () => {
    const config = await ConfigService.load();
    expect(config.llm.apiKey).toBe('test-key');
    expect(config.automation.browser).toBe('chromium');
  });
});
