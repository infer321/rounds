import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Preset = {
  id: string;
  label: string;
  duration: string;
  builtIn?: boolean;
};

const STORAGE_KEY = '@rounds_presets';

export const BUILT_IN_PRESETS: Preset[] = [
  { id: 'bi1', label: 'CT results',     duration: '3h',  builtIn: true },
  { id: 'bi2', label: 'Troponin repeat',duration: '3h',  builtIn: true },
  { id: 'bi3', label: 'Lactate repeat', duration: '2h',  builtIn: true },
  { id: 'bi4', label: 'Blood cultures', duration: '48h', builtIn: true },
  { id: 'bi5', label: 'CBC / BMP repeat',duration:'4h',  builtIn: true },
  { id: 'bi6', label: 'INR check',      duration: '6h',  builtIn: true },
  { id: 'bi7', label: 'Urine output',   duration: '1h',  builtIn: true },
  { id: 'bi8', label: 'Neuro check',    duration: '2h',  builtIn: true },
  { id: 'bi9', label: 'Post-op vitals', duration: '15m', builtIn: true },
];

export function usePresets() {
  const [custom, setCustom] = useState<Preset[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setCustom(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  function saveCustom(next: Preset[]) {
    setCustom(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }

  function addPreset(label: string, duration: string) {
    const next = [...custom, { id: Date.now().toString(), label: label.trim(), duration: duration.trim() }];
    saveCustom(next);
  }

  function deletePreset(id: string) {
    saveCustom(custom.filter(p => p.id !== id));
  }

  return {
    presets: [...BUILT_IN_PRESETS, ...custom],
    custom,
    addPreset,
    deletePreset,
  };
}
