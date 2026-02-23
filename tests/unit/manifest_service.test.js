import { ManifestService } from '../../src/services/manifest_service.js';
import fs from 'fs/promises';
import path from 'path';

describe('ManifestService', () => {
  const testDir = path.join(process.cwd(), 'tests', 'tmp_resources');
  const manifestPath = path.join(testDir, 'manifests.json');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify({ mappings: {} }));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should sync manifest with existing resource files', async () => {
    const naverPath = path.join(testDir, 'naver.resource');
    await fs.writeFile(naverPath, '*** Keywords ***');

    const service = new ManifestService(testDir);
    await service.sync();

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    expect(manifest.mappings['web/naver.resource']).toBeDefined();
  });

  it('should add a new mapping', async () => {
    const service = new ManifestService(testDir);
    await service.addMapping('web/google.resource', ['google', 'Search']);

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    expect(manifest.mappings['web/google.resource']).toContain('google');
  });

  it('should remove dead mappings during sync', async () => {
    await fs.writeFile(manifestPath, JSON.stringify({ 
      mappings: { 'web/dead.resource': ['dead'] } 
    }));

    const service = new ManifestService(testDir);
    await service.sync();

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    expect(manifest.mappings).not.toHaveProperty('web/dead.resource');
  });
});
