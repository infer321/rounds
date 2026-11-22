import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { AppState } from 'react-native';
import { Patient, Item, HAndP, PanelKey } from '../data/patients';
import { parseDurationMs } from '../utils/time';
import { loadPatients, savePatients } from '../utils/patientStore';
import { uid } from '../utils/id';
import { advanceHP } from '../utils/rounds';
import { useSettings } from './SettingsContext';
import { scheduleTimer, cancelTimer } from '../utils/notifications';

const SAVE_DEBOUNCE_MS = 1500; // flushed immediately when the app backgrounds


type HPUpdate = Partial<HAndP> | ((hp: HAndP) => HAndP);
type Details = { initials?: string; age?: string; gender?: string; descriptor?: string };

type Ctx = {
  patients: Patient[];
  loaded: boolean;
  loadError: boolean;
  addPatient: (d: Details & { initials: string }) => string;
  editPatient: (id: string, d: Details) => void;
  deletePatient: (id: string) => Patient | undefined;
  restorePatient: (p: Patient, index?: number) => void;
  clearAll: () => void;

  addItem: (pid: string, item: Omit<Item, 'id'>, durationStr?: string) => Promise<void>;
  editItem: (pid: string, itemId: string, label: string, durationStr?: string) => Promise<void>;
  removeItem: (pid: string, itemId: string) => Item | undefined;
  restoreItem: (pid: string, item: Item) => void;
  toggleSignout: (pid: string, itemId: string) => void;
  toggleHandedOff: (pid: string, itemId: string) => void;

  patchHP: (pid: string, u: HPUpdate) => void;
  advancePanel: (pid: string, panel: PanelKey) => void;
  completeRound: (pid: string) => void;
};

/** Normalize patient detail fields (uppercase initials, empty → undefined). */
function clean(d: Details) {
  const out: Details = {};
  if (d.initials !== undefined) out.initials = d.initials.trim().toUpperCase().slice(0, 3);
  if (d.age !== undefined) out.age = d.age.trim() || undefined;
  if (d.gender !== undefined) out.gender = d.gender || undefined;
  if (d.descriptor !== undefined) out.descriptor = d.descriptor.trim() || undefined;
  return out;
}

const PatientsContext = createContext<Ctx | null>(null);

export function PatientsProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const latest = useRef<Patient[]>([]);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  latest.current = patients;

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadPatients().then(({ patients: p, error }) => {
      setPatients(p);
      setLoadError(error);
      setLoaded(true);
    });
  }, []);

  // ── Save: debounced, encrypted, flushed when app backgrounds ────────────
  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!dirty.current) return;
    dirty.current = false;
    try {
      await savePatients(latest.current);
    } catch (e) {
      dirty.current = true; // retry next change
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

  // ── Notifications ───────────────────────────────────────────────────────
  const schedule = (label: string, endsAt: number, initials?: string) =>
    scheduleTimer(label, endsAt, settings.notifShowInitials ? initials : undefined);
  const cancel = cancelTimer;
  const cancelAll = (p: Patient) => p.items.forEach(i => cancel(i.notificationId));

  const mapPatient = (pid: string, fn: (p: Patient) => Patient) =>
    setPatients(prev => prev.map(p => (p.id === pid ? fn(p) : p)));

  // ── Patients ────────────────────────────────────────────────────────────
  function addPatient(d: Details & { initials: string }) {
    const id = uid();
    setPatients(prev => [...prev, { id, colorIndex: 0, items: [], ...clean(d) } as Patient]);
    return id;
  }

  const editPatient = (id: string, d: Details) => mapPatient(id, p => ({ ...p, ...clean(d) }));

  function deletePatient(id: string) {
    const p = latest.current.find(x => x.id === id);
    if (p) cancelAll(p);
    setPatients(prev => prev.filter(x => x.id !== id));
    return p;
  }

  function restorePatient(p: Patient, index?: number) {
    setPatients(prev => {
      const next = [...prev];
      next.splice(index ?? next.length, 0, p);
      return next;
    });
    p.items.forEach(async i => {
      if (i.type === 'timer' && i.endsAt && i.endsAt > Date.now()) {
        const nid = await schedule(i.label, i.endsAt, p.initials);
        mapPatient(p.id, pp => ({ ...pp, items: pp.items.map(x => x.id === i.id ? { ...x, notificationId: nid } : x) }));
      }
    });
  }

  function clearAll() {
    latest.current.forEach(cancelAll);
    setPatients([]);
  }

  // ── Items ───────────────────────────────────────────────────────────────
  async function addItem(pid: string, item: Omit<Item, 'id'>, durationStr?: string) {
    const id = uid();
    let endsAt = item.endsAt;
    let notificationId: string | undefined;
    if (item.type === 'timer' && durationStr) {
      const ms = parseDurationMs(durationStr);
      if (ms > 0) {
        endsAt = Date.now() + ms;
        notificationId = await schedule(item.label, endsAt, latest.current.find(p => p.id === pid)?.initials);
      }
    }
    mapPatient(pid, p => ({ ...p, items: [...p.items, { ...item, id, endsAt, notificationId }] }));
  }

  async function editItem(pid: string, itemId: string, label: string, durationStr?: string) {
    const patient = latest.current.find(p => p.id === pid);
    const old = patient?.items.find(i => i.id === itemId);
    let patch: Partial<Item> = { label };
    if (old?.type === 'timer' && durationStr) {
      const ms = parseDurationMs(durationStr);
      if (ms > 0) {
        cancel(old.notificationId);
        const endsAt = Date.now() + ms;
        patch = { label, endsAt, notificationId: await schedule(label, endsAt, patient?.initials) };
      }
    }
    mapPatient(pid, p => ({ ...p, items: p.items.map(i => (i.id === itemId ? { ...i, ...patch } : i)) }));
  }

  function removeItem(pid: string, itemId: string) {
    const item = latest.current.find(p => p.id === pid)?.items.find(i => i.id === itemId);
    cancel(item?.notificationId);
    mapPatient(pid, p => ({ ...p, items: p.items.filter(i => i.id !== itemId) }));
    return item;
  }

  async function restoreItem(pid: string, item: Item) {
    mapPatient(pid, p => ({ ...p, items: [...p.items, { ...item, notificationId: undefined }] }));
    if (item.type === 'timer' && item.endsAt && item.endsAt > Date.now()) {
      const nid = await schedule(item.label, item.endsAt, latest.current.find(p => p.id === pid)?.initials);
      mapPatient(pid, p => ({ ...p, items: p.items.map(i => (i.id === item.id ? { ...i, notificationId: nid } : i)) }));
    }
  }

  const toggleItem = (key: 'signout' | 'handedOff') => (pid: string, itemId: string) =>
    mapPatient(pid, p => ({ ...p, items: p.items.map(i => (i.id === itemId ? { ...i, [key]: !i[key] } : i)) }));

  // ── H&P ─────────────────────────────────────────────────────────────────
  function patchHP(pid: string, u: HPUpdate) {
    mapPatient(pid, p => {
      const cur = p.hp ?? {};
      return { ...p, hp: typeof u === 'function' ? u(cur) : { ...cur, ...u } };
    });
  }

  const advancePanel = (pid: string, panel: PanelKey) => patchHP(pid, hp => advanceHP(hp, [panel]));
  const completeRound = (pid: string) => patchHP(pid, hp => advanceHP(hp, ['vitals', 'cbc', 'bmp', 'lft', 'coag']));

  return (
    <PatientsContext.Provider value={{
      patients, loaded, loadError,
      addPatient, editPatient, deletePatient, restorePatient, clearAll,
      addItem, editItem, removeItem, restoreItem,
      toggleSignout: toggleItem('signout'), toggleHandedOff: toggleItem('handedOff'),
      patchHP, advancePanel, completeRound,
    }}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  const ctx = useContext(PatientsContext);
  if (!ctx) throw new Error('usePatients must be used inside PatientsProvider');
  return ctx;
}
