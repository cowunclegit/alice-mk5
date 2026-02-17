import crypto from 'crypto';

export class VaultService {
  static algorithm = 'aes-256-gcm';
  static ivLength = 16;
  static tagLength = 16;

  static encrypt(text, masterKey) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(masterKey, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }

  static decrypt(encryptedText, masterKey) {
    const ivHex = encryptedText.slice(0, 32);
    const tagHex = encryptedText.slice(32, 64);
    const encryptedData = encryptedText.slice(64);
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(masterKey, 'hex'), iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
