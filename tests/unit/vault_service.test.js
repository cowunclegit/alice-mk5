import { VaultService } from '../../src/services/vault_service.js';

describe('VaultService', () => {
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars = 32 bytes

  it('should encrypt and decrypt a secret', async () => {
    const secret = 'my-password';
    const encrypted = VaultService.encrypt(secret, masterKey);
    expect(encrypted).not.toBe(secret);
    
    const decrypted = VaultService.decrypt(encrypted, masterKey);
    expect(decrypted).toBe(secret);
  });
});
