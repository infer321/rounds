/**
 * Encrypted persistence for the patient list.
 * Never overwrites data it can't read: unreadable ciphertext is parked
 * under a side key and the app starts empty with an error flag.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient } from '../data/patients';
import { encryptData, decryptData } from './encryption';

const KEY = '@rounds_patients';

export async function loadPatients(): Promise<{ patients: Patient[]; error: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { patients: [], error: false };
    const plain = (await decryptData(raw)) ?? (raw.trim().startsWith('[') ? raw : null); // legacy plaintext saves
    if (plain) return { patients: JSON.parse(plain), error: false };
    await AsyncStorage.setItem(`${KEY}_unreadable_${Date.now()}`, raw);
    return { patients: [], error: true };
  } catch {
    return { patients: [], error: true };
  }
}

export async function savePatients(patients: Patient[]): Promise<void> {
  await AsyncStorage.setItem(KEY, await encryptData(JSON.stringify(patients)));
}
