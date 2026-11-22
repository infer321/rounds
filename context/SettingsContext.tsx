/**
 * App-wide settings + timer presets in one shared store.
 * (Previously each screen called its own useSlotCount/usePresets hook, so a
 * change in Settings didn't reach the Home screen until it remounted.)
 */
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUILT_IN_PHRASES, Phrase } from '../utils/phrases';
import { uid } from '../utils/id';

export type Preset = { id: string; label: string; duration: string; builtIn?: boolean; hidden?: boolean };

export const BUILT_IN_PRESETS: Preset[] = [
  { id: 'bi1', label: 'CT results',       duration: '3h',  builtIn: true },
  { id: 'bi2', label: 'Troponin repeat',  duration: '3h',  builtIn: true },
  { id: 'bi3', label: 'Lactate repeat',   duration: '2h',  builtIn: true },
  { id: 'bi4', label: 'Blood cultures',   duration: '48h', builtIn: true },
  { id: 'bi5', label: 'CBC / BMP repeat', duration: '4h',  builtIn: true },
  { id: 'bi6', label: 'INR check',        duration: '6h',  builtIn: true },
  { id: 'bi7', label: 'Urine output',     duration: '1h',  builtIn: true },
  { id: 'bi8', label: 'Neuro check',      duration: '2h',  builtIn: true },
  { id: 'bi9', label: 'Post-op vitals',   duration: '15m', builtIn: true },
];

export type Appearance = 'system' | 'light' | 'dark';

export type Settings = {
  slotCount: number;
  autoLockMin: number;        // 0 = lock as soon as app leaves foreground
  notifShowInitials: boolean; // patient initials on lock-screen notifications
  appearance: Appearance;
  staleDays: number;          // remind to clear patients untouched this long; 0 = off
  onboarded: boolean;
};

const DEFAULTS: Settings = { slotCount: 8, autoLockMin: 1, notifShowInitials: false, appearance: 'system', staleDays: 3, onboarded: false };

const K_SETTINGS = '@rounds_settings_v2';
const K_SLOTS    = '@rounds_slot_count';   // legacy
const K_PRESETS  = '@rounds_presets';
const K_PHRASES  = '@rounds_phrases';

type Ctx = {
  settings: Settings;
  ready: boolean;
  update: (p: Partial<Settings>) => void;
  presets: Preset[];
  hasHiddenBuiltIns: boolean;
  addPreset: (label: string, duration: string) => void;
  editPreset: (id: string, label: string, duration: string) => void;
  deletePreset: (id: string) => void;
  restoreDefaults: () => void;
  phrases: Phrase[];                      // built-ins + custom (custom wins on same trigger)
  customPhrases: Phrase[];
  savePhrase: (p: Omit<Phrase, 'id'> & { id?: string }) => void;
  deletePhrase: (id: string) => void;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [custom, setCustom] = useState<Preset[]>([]);
  const [customPhrases, setCustomPhrases] = useState<Phrase[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rawS, rawSlots, rawP, rawPh] = await Promise.all([
          AsyncStorage.getItem(K_SETTINGS), AsyncStorage.getItem(K_SLOTS), AsyncStorage.getItem(K_PRESETS), AsyncStorage.getItem(K_PHRASES),
        ]);
        if (rawPh) setCustomPhrases(JSON.parse(rawPh));
        const next = { ...DEFAULTS };
        if (rawSlots) next.slotCount = parseInt(rawSlots) || DEFAULTS.slotCount;
        if (rawS) Object.assign(next, JSON.parse(rawS));
        setSettings(next);
        if (rawP) setCustom(JSON.parse(rawP));
      } catch {
        // Corrupt settings: fall back to defaults rather than block launch
      }
      setReady(true);
    })();
  }, []);

  // Apply appearance override (null = follow the phone)
  useEffect(() => {
    Appearance.setColorScheme(settings.appearance === 'system' ? null : settings.appearance);
  }, [settings.appearance]);

  const update = useCallback((p: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...p };
      next.slotCount = Math.min(16, Math.max(1, next.slotCount));
      AsyncStorage.setItem(K_SETTINGS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  function saveCustom(next: Preset[]) {
    setCustom(next);
    AsyncStorage.setItem(K_PRESETS, JSON.stringify(next)).catch(() => {});
  }

  const presets: Preset[] = [
    ...BUILT_IN_PRESETS
      .map(b => { const o = custom.find(c => c.id === b.id); return o ? { ...b, label: o.label || b.label, duration: o.duration || b.duration, hidden: o.hidden } : b; })
      .filter(b => !b.hidden),
    ...custom.filter(c => !BUILT_IN_PRESETS.some(b => b.id === c.id)),
  ];
  const hasHiddenBuiltIns = BUILT_IN_PRESETS.some(b => custom.some(c => c.id === b.id && c.hidden));

  const addPreset = (label: string, duration: string) =>
    saveCustom([...custom, { id: uid(), label: label.trim(), duration: duration.trim() }]);

  const editPreset = (id: string, label: string, duration: string) =>
    custom.some(c => c.id === id)
      ? saveCustom(custom.map(c => c.id === id ? { ...c, label: label.trim(), duration: duration.trim(), hidden: false } : c))
      : saveCustom([...custom, { id, label: label.trim(), duration: duration.trim() }]);

  const deletePreset = (id: string) => {
    if (!BUILT_IN_PRESETS.some(b => b.id === id)) return saveCustom(custom.filter(c => c.id !== id));
    custom.some(c => c.id === id)
      ? saveCustom(custom.map(c => c.id === id ? { ...c, hidden: true } : c))
      : saveCustom([...custom, { id, label: '', duration: '', hidden: true }]);
  };

  const restoreDefaults = () => saveCustom(custom.map(c => ({ ...c, hidden: false })));

  function saveCustomPhrases(next: Phrase[]) {
    setCustomPhrases(next);
    AsyncStorage.setItem(K_PHRASES, JSON.stringify(next)).catch(() => undefined);
  }
  const savePhrase = (p: Omit<Phrase, 'id'> & { id?: string }) => {
    const clean = { trigger: p.trigger.replace(/^\./, '').trim().toLowerCase(), text: p.text };
    if (p.id && customPhrases.some(c => c.id === p.id)) saveCustomPhrases(customPhrases.map(c => (c.id === p.id ? { ...c, ...clean } : c)));
    else saveCustomPhrases([...customPhrases, { id: uid(), ...clean }]);
  };
  const deletePhrase = (id: string) => saveCustomPhrases(customPhrases.filter(c => c.id !== id));
  const phrases = [
    ...customPhrases,
    ...BUILT_IN_PHRASES.filter(b => !customPhrases.some(c => c.trigger === b.trigger)).map(b => ({ ...b, builtIn: true })),
  ];

  return (
    <SettingsCtx.Provider value={{ settings, ready, update, presets, hasHiddenBuiltIns, addPreset, editPreset, deletePreset, restoreDefaults, phrases, customPhrases, savePhrase, deletePhrase }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error('useSettings must be inside SettingsProvider');
  return c;
}
