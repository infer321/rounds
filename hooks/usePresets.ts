import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Preset = {
  id: string;
  label: string;
  duration: string;
  builtIn?: boolean;
  hidden?: boolean;
};

const STORAGE_KEY = '@rounds_presets';

export const BUILT_IN_PRESETS: Preset[] = [
  { id: 'bi1', label: 'CT results',      duration: '3h',  builtIn: true },
  { id: 'bi2', label: 'Troponin repeat', duration: '3h',  builtIn: true },
  { id: 'bi3', label: 'Lactate repeat',  duration: '2h',  builtIn: true },
  { id: 'bi4', label: 'Blood cultures',  duration: '48h', builtIn: true },
  { id: 'bi5', label: 'CBC / BMP repeat',duration: '4h',  builtIn: true },
  { id: 'bi6', label: 'INR check',       duration: '6h',  builtIn: true },
  { id: 'bi7', label: 'Urine output',    duration: '1h',  builtIn: true },
  { id: 'bi8', label: 'Neuro check',     duration: '2h',  builtIn: true },
  { id: 'bi9', label: 'Post-op vitals',  duration: '15m', builtIn: true },
];

export function usePresets() {
  const [custom, setCustom] = useState<Preset[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) { try { setCustom(JSON.parse(raw)); } catch {} }
    });
  }, []);

  function saveCustom(next: Preset[]) {
    setCustom(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }

  // Visible presets: built-ins (with overrides applied, hidden ones removed) + user-added customs
  const presets: Preset[] = [
    ...BUILT_IN_PRESETS
      .map(b => {
        const override = custom.find(c => c.id === b.id);
        return override ? { ...b, label: override.label, duration: override.duration, hidden: override.hidden } : b;
      })
      .filter(b => !b.hidden),
    ...custom.filter(c => !BUILT_IN_PRESETS.some(b => b.id === c.id)),
  ];

  const hasHiddenBuiltIns = BUILT_IN_PRESETS.some(b => custom.find(c => c.id === b.id && c.hidden));

  function addPreset(label: string, duration: string) {
    saveCustom([...custom, { id: Date.now().toString(), label: label.trim(), duration: duration.trim() }]);
  }

  function editPreset(id: string, label: string, duration: string) {
    const idx = custom.findIndex(c => c.id === id);
    if (idx >= 0) {
      saveCustom(custom.map(c => c.id === id ? { ...c, label: label.trim(), duration: duration.trim(), hidden: false } : c));
    } else {
      saveCustom([...custom, { id, label: label.trim(), duration: duration.trim() }]);
    }
  }

  function deletePreset(id: string) {
    const isBuiltIn = BUILT_IN_PRESETS.some(b => b.id === id);
    if (isBuiltIn) {
      const idx = custom.findIndex(c => c.id === id);
      if (idx >= 0) {
        saveCustom(custom.map(c => c.id === id ? { ...c, hidden: true } : c));
      } else {
        saveCustom([...custom, { id, label: '', duration: '', hidden: true }]);
      }
    } else {
      saveCustom(custom.filter(c => c.id !== id));
    }
  }

  function restoreDefaults() {
    // Remove all hidden flags from built-ins
    saveCustom(custom.map(c => ({ ...c, hidden: false })));
  }

  return { presets, custom, hasHiddenBuiltIns, addPreset, editPreset, deletePreset, restoreDefaults };
}
