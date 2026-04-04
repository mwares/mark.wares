import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../../utils/encryption.js';
import { randomBytes } from 'node:crypto';

describe('Encryption Utils', () => {
  beforeEach(() => {
    // Set a valid 256-bit key for testing
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
  });

  it('encrypts and decrypts a string correctly', () => {
    const plaintext = 'my-secret-tesla-token-12345';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const plaintext = 'same-input';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('encrypted format contains iv:authTag:ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');

    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(32); // 16 bytes = 32 hex chars
    expect(parts[1].length).toBe(32); // 16 bytes = 32 hex chars
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    // Tamper with the ciphertext
    parts[2] = 'ff' + parts[2].slice(2);
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws on invalid format', () => {
    expect(() => decrypt('not:valid')).toThrow('Invalid encrypted text format');
  });

  it('throws when ENCRYPTION_KEY is not set', () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable not set');
  });

  it('handles empty string', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('handles unicode strings', () => {
    const plaintext = 'Tesla token with unicode: 太陽光パネル';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });
});
