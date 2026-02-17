import { StorageService } from '../../src/services/storage_service.js';
import fs from 'fs/promises';
import path from 'path';

describe('StorageService', () => {
  const sequencesDir = path.join(process.cwd(), 'src/memory/sequences');

  afterEach(async () => {
    // Cleanup files in sequences directory
    try {
      const files = await fs.readdir(sequencesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(sequencesDir, file));
        }
      }
    } catch (e) {
      // ignore
    }
  });

  it('should save and load a sequence', async () => {
    const sequence = {
      id: 'test-tool',
      actions: [{ keyword: 'No Operation', args: [] }],
      metadata: { prompt: 'Do nothing' }
    };

    await StorageService.saveSequence(sequence);
    
    const loaded = await StorageService.loadSequence('test-tool');
    expect(loaded.id).toBe('test-tool');
    expect(loaded.actions).toHaveLength(1);
  });
});
