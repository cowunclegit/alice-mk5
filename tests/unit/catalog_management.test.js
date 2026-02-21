import { StorageService } from '../../src/services/storage_service.js';
import fs from 'fs/promises';
import path from 'path';

describe('StorageService.updateCatalog', () => {
  const catalogPath = path.join(process.cwd(), 'src/memory/tools/catalog.json');

  beforeEach(async () => {
    // Reset catalog
    await fs.writeFile(catalogPath, JSON.stringify({ tools: [], last_updated: new Date().toISOString() }));
  });

  it('should add a tool to the catalog', async () => {
    const manifest = {
      id: 'test-tool',
      title: 'Test Tool',
      description: 'A tool for testing',
      platform: 'web',
      version: '1.0.0'
    };

    await StorageService.updateCatalog(manifest);
    
    const content = await fs.readFile(catalogPath, 'utf8');
    const catalog = JSON.parse(content);
    
    expect(catalog.tools.length).toBe(1);
    expect(catalog.tools[0].id).toBe('test-tool');
  });

  it('should update an existing tool in the catalog', async () => {
    const manifest1 = { id: 'test-tool', title: 'Old Title' };
    const manifest2 = { id: 'test-tool', title: 'New Title' };

    await StorageService.updateCatalog(manifest1);
    await StorageService.updateCatalog(manifest2);
    
    const content = await fs.readFile(catalogPath, 'utf8');
    const catalog = JSON.parse(content);
    
    expect(catalog.tools.length).toBe(1);
    expect(catalog.tools[0].title).toBe('New Title');
  });
});
