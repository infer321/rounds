import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Patient, Item, HAndP, PanelKey, IPass } from '../data/patients';
import { parseDurationMs } from '../utils/time';
import { loadPatients } from '../utils/patientStore';
import { useEncryptedSave } from '../hooks/useEncryptedSave';
import { uid } from '../utils/id';
import { advanceHP } from '../utils/rounds';
import { useSettings } from './SettingsContext';
import { scheduleTimer, cancelTimer, listenForTimerActions, SNOOZE } from '../utils/notifications';
import { demoPatient } from '../utils/demo';



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
  restorePatients: (ps: Patient[]) => void;
  clearAll: () => void;
  addDemoPatient: () => string;
  patchIPass: (pid: string, p: Partial<IPass>) => void;

  addItem: (pid: string, item: Omit<Item, 'id'>, durationStr?: string) => Promise<void>;
  editItem: (pid: string, itemId: string, label: string, durationStr?: string) => Promise<void>;
  removeItem: (pid: string, itemId: string) => Item | undefined;
  restoreItem: (pid: string, item: Item) => void;
  toggleSignout: (pid: string, itemId: string) => void;
  toggleHandedOff: (pid: string, itemId: string) => void;
  snoozeItem: (pid: string, itemId: string, minutes: number) => Promise<void>;

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
  latest.current = patients;

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadPatients().then(({ patients: p, error }) => {
      const now = Date.now();
      setPatients(p.map(x => (x.updatedAt ? x : { ...x, updatedAt: now })));
      setLoadError(error);
      setLoaded(true);
    });
  }, []);

  useEncryptedSave(patients, loaded);

  // ── Notifications ───────────────────────────────────────────────────────
  const schedule = (label: string, endsAt: number, pid: string, itemId: string) => {
    const initials = latest.current.find(p => p.id === pid)?.initials;
    return scheduleTimer(label, endsAt, { pid, itemId }, settings.notifShowInitials ? initials : undefined);
  };
  const cancel = cancelTimer;
  const cancelAll = (p: Patient) => p.items.forEach(i => cancel(i.notificationId));

  const mapPatient = (pid: string, fn: (p: Patient) => Patient) =>
    setPatients(prev => prev.map(p => (p.id === pid ? { ...fn(p), updatedAt: Date.now() } : p)));

  // ── Patients ────────────────────────────────────────────────────────────
  function addPatient(d: Details & { initials: string }) {
    const id = uid();
    setPatients(prev => [...prev, { id, colorIndex: 0, items: [], updatedAt: Date.now(), ...clean(d) } as Patient]);
    return id;
  }

  function addDemoPatient() {
    const p = demoPatient();
    setPatients(prev => [...prev, p]);
    return p.id;
  }

  const patchIPass = (pid: string, u: Partial<IPass>) => mapPatient(pid, p => ({ ...p, ipass: { ...p.ipass, ...u } }));

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
    rescheduleAll(p);
  }

  function restorePatients(ps: Patient[]) {
    setPatients(prev => [...prev, ...ps]);
    ps.forEach(rescheduleAll);
  }

  function rescheduleAll(p: Patient) {
    p.items.forEach(async i => {
      if (i.type === 'timer' && i.endsAt && i.endsAt > Date.now()) {
        const nid = await schedule(i.label, i.endsAt, p.id, i.id);
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
        notificationId = await schedule(item.label, endsAt, pid, id);
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
        patch = { label, endsAt, notificationId: await schedule(label, endsAt, pid, itemId) };
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
      const nid = await schedule(item.label, item.endsAt, pid, item.id);
      mapPatient(pid, p => ({ ...p, items: p.items.map(i => (i.id === item.id ? { ...i, notificationId: nid } : i)) }));
    }
  }

  /** Push a timer out by N minutes from now (notification "+15 min" button). */
  async function snoozeItem(pid: string, itemId: string, minutes: number) {
    const item = latest.current.find(p => p.id === pid)?.items.find(i => i.id === itemId);
    if (!item) return;
    cancel(item.notificationId);
    const endsAt = Date.now() + minutes * 60_000;
    const notificationId = await schedule(item.label, endsAt, pid, itemId);
    mapPatient(pid, p => ({ ...p, items: p.items.map(i => (i.id === itemId ? { ...i, endsAt, notificationId } : i)) }));
  }

  // Notification buttons (works on cold launch too, once patients are loaded)
  const actions = useRef({ snoozeItem, removeItem });
  actions.current = { snoozeItem, removeItem };
  useEffect(() => {
    if (!loaded) return;
    return listenForTimerActions((action, { pid, itemId }) => {
      if (action === SNOOZE) actions.current.snoozeItem(pid, itemId, 15);
      else actions.current.removeItem(pid, itemId);
    });
  }, [loaded]);

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
  const completeRound = (pid: string) => patchHP(pid, hp => advanceHP(hp, ['vitals', 'cbc', 'bmp', 'lft', 'coag'], true));

  return (
    <PatientsContext.Provider value={{
      patients, loaded, loadError,
      addPatient, editPatient, deletePatient, restorePatient, restorePatients, clearAll, addDemoPatient, patchIPass,
      addItem, editItem, removeItem, restoreItem, snoozeItem,
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
