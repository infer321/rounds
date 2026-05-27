import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, Item, SAMPLE_PATIENTS, COLORS } from '../data/patients';
import { parseDurationMs } from '../utils/time';

const STORAGE_KEY = '@rounds_patients';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type PatientsContextType = {
  patients: Patient[];
  addPatient: (initials: string) => string;
  addItem: (patientId: string, item: Omit<Item, 'id'>, durationStr?: string) => Promise<void>;
  editItem: (patientId: string, itemId: string, label: string, durationStr?: string) => Promise<void>;
  markDone: (patientId: string, itemId: string) => void;
  toggleSignout: (patientId: string, itemId: string) => void;
  deletePatient: (patientId: string) => void;
  clearAll: () => void;
};

const PatientsContext = createContext<PatientsContextType | null>(null);

export function PatientsProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const loaded = useRef(false);

  // Load from storage on mount
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      loaded.current = true;
      if (raw) {
        try {
          setPatients(JSON.parse(raw));
        } catch {
          setPatients(SAMPLE_PATIENTS);
        }
      } else {
        setPatients(SAMPLE_PATIENTS);
      }
    });
  }, []);

  // Persist on every change (skip the initial empty state before load)
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(patients)).catch(() => {});
  }, [patients]);

  function addPatient(initials: string): string {
    const id = Date.now().toString();
    const newPatient: Patient = {
      id,
      initials: initials.trim().toUpperCase().slice(0, 3),
      colorIndex: patients.length % COLORS.length,
      items: [],
    };
    setPatients(prev => [...prev, newPatient]);
    return id;
  }

  async function addItem(patientId: string, item: Omit<Item, 'id'>, durationStr?: string) {
    const id = Date.now().toString();
    let endsAt = item.endsAt;
    let notificationId: string | undefined;

    if (item.type === 'timer' && durationStr && durationStr !== '—') {
      const ms = parseDurationMs(durationStr);
      if (ms > 0) {
        endsAt = Date.now() + ms;
        const patient = patients.find(p => p.id === patientId);
        try {
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `⏰ ${item.label}`,
              body: `Patient ${patient?.initials ?? ''} — timer expired`,
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
          });
        } catch (_) {}
      }
    }

    setPatients(prev =>
      prev.map(p =>
        p.id === patientId
          ? { ...p, items: [...p.items, { ...item, id, endsAt, notificationId }] }
          : p
      )
    );
  }

  function markDone(patientId: string, itemId: string) {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        const item = p.items.find(i => i.id === itemId);
        if (item?.notificationId) {
          Notifications.cancelScheduledNotificationAsync(item.notificationId).catch(() => {});
        }
        return { ...p, items: p.items.filter(i => i.id !== itemId) };
      })
    );
  }

  async function editItem(patientId: string, itemId: string, label: string, durationStr?: string) {
    let endsAt: number | undefined;
    let notificationId: string | undefined;

    if (durationStr && durationStr !== '—') {
      const ms = parseDurationMs(durationStr);
      if (ms > 0) {
        endsAt = Date.now() + ms;
        const patient = patients.find(p => p.id === patientId);
        // cancel old notification
        const oldItem = patient?.items.find(i => i.id === itemId);
        if (oldItem?.notificationId) {
          Notifications.cancelScheduledNotificationAsync(oldItem.notificationId).catch(() => {});
        }
        try {
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `⏰ ${label}`,
              body: `Patient ${patient?.initials ?? ''} — timer expired`,
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
          });
        } catch (_) {}
      }
    }

    setPatients(prev =>
      prev.map(p =>
        p.id !== patientId ? p : {
          ...p,
          items: p.items.map(i =>
            i.id !== itemId ? i : {
              ...i,
              label,
              ...(endsAt !== undefined ? { endsAt, notificationId } : {}),
            }
          ),
        }
      )
    );
  }

  function toggleSignout(patientId: string, itemId: string) {
    setPatients(prev =>
      prev.map(p =>
        p.id !== patientId ? p : {
          ...p,
          items: p.items.map(i => i.id === itemId ? { ...i, signout: !i.signout } : i),
        }
      )
    );
  }

  function cancelAllNotifications(p: Patient) {
    p.items.forEach(item => {
      if (item.notificationId) {
        Notifications.cancelScheduledNotificationAsync(item.notificationId).catch(() => {});
      }
    });
  }

  function deletePatient(patientId: string) {
    setPatients(prev => {
      const patient = prev.find(p => p.id === patientId);
      if (patient) cancelAllNotifications(patient);
      return prev.filter(p => p.id !== patientId);
    });
  }

  function clearAll() {
    setPatients(prev => {
      prev.forEach(cancelAllNotifications);
      return [];
    });
  }

  return (
    <PatientsContext.Provider value={{ patients, addPatient, addItem, editItem, markDone, toggleSignout, deletePatient, clearAll }}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  const ctx = useContext(PatientsContext);
  if (!ctx) throw new Error('usePatients must be used inside PatientsProvider');
  return ctx;
}
