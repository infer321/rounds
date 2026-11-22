/**
 * AES-256 encryption for AsyncStorage data.
 *
 * Key lifecycle:
 *   - 256-bit key from the OS CSPRNG (expo-crypto)
 *   - Stored in iOS Keychain / Android Keystore via expo-secure-store,
 *     readable only while the device is unlocked, never synced to iCloud
 *   - Cached in memory after first retrieval
 *
 * Why the polyfill: Hermes does not ship `crypto.getRandomValues`. Both the
 * key generator and crypto-js (for its per-message salt) need it. Without it
 * every encrypt call throws and nothing is ever written to disk.
 */
import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const g = globalThis as any;
if (!g.crypto) g.crypto = {};
if (!g.crypto.getRandomValues) {
  g.crypto.getRandomValues = (arr: Uint8Array) => ExpoCrypto.getRandomValues(arr);
}

const KEY_NAME = 'rounds_aes_key_v1';
const KEY_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let cachedKey: string | null = null;

async function getKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  let key = await SecureStore.getItemAsync(KEY_NAME); // no opts: must still find keys saved by older builds
  if (!key) {
    const bytes = ExpoCrypto.getRandomBytes(32);
    key = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(KEY_NAME, key, KEY_OPTS);
  }
  cachedKey = key;
  return key;
}

export async function encryptData(plaintext: string): Promise<string> {
  const key = await getKey();
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

/** Returns null if the ciphertext can't be decrypted with this device's key. */
export async function decryptData(ciphertext: string): Promise<string | null> {
  try {
    const key = await getKey();
    const out = CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
    return out || null;
  } catch {
    return null;
  }
}
