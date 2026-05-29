/**
 * AES-256 encryption for AsyncStorage data.
 *
 * Key lifecycle:
 *   - Generated once using crypto.getRandomValues (CSPRNG)
 *   - Stored in iOS Keychain / Android Keystore via expo-secure-store
 *   - Cached in memory after first retrieval
 *   - Never leaves the device
 */
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const KEY_NAME = 'rounds_aes_key_v1';

let _cachedKey: string | null = null;

async function getKey(): Promise<string> {
  if (_cachedKey) return _cachedKey;

  let key = await SecureStore.getItemAsync(KEY_NAME);

  if (!key) {
    // Generate a cryptographically secure 256-bit (32-byte) key
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    key = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(KEY_NAME, key);
  }

  _cachedKey = key;
  return key;
}

/** Encrypt a plaintext string → AES-256 ciphertext. */
export async function encryptData(plaintext: string): Promise<string> {
  const key = await getKey();
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

/**
 * Decrypt AES-256 ciphertext → plaintext.
 * Returns null if decryption fails (e.g. pre-encryption legacy data).
 */
export async function decryptData(ciphertext: string): Promise<string | null> {
  try {
    const key = await getKey();
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || null;
  } catch {
    return null;
  }
}
