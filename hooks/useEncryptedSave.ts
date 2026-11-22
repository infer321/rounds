/**
 * Saves the patient list after edits settle (debounced) and immediately
 * when the app leaves the foreground. A failed save retries on the next change.
 */
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Patient } from '../data/patients';
import { savePatients } from '../utils/patientStore';

const SAVE_DEBOUNCE_MS = 1500;

export function useEncryptedSave(patients: Patient[], loaded: boolean) {
  const latest = useRef(patients);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  latest.current = patients;

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!dirty.current) return;
    dirty.current = false;
    try {
      await savePatients(latest.current);
    } catch (e) {
      dirty.current = true;
      console.warn('[rounds] save failed', e);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }, [patients, loaded, flush]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s !== 'active') flush(); });
    return () => sub.remove();
  }, [flush]);
}
