/**
 * AuthGate
 *
 * - Children stay mounted while locked. (Before, locking unmounted the whole
 *   app: every trip to Epic/Teams dumped you back on Home and dropped any
 *   unsaved typing.)
 * - A privacy cover goes up the moment the app leaves the foreground, so the
 *   app-switcher snapshot never shows patient data.
 * - Re-auth only after the auto-lock window (Settings) has elapsed.
 * - Devices with no passcode at all are let through instead of soft-locked.
 */
import { useEffect, useRef, useState, ReactNode } from 'react';
import { View, Text, Pressable, AppState, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSettings } from '../context/SettingsContext';
import Icon from './Icon';
import { C, T, R, S } from '../theme';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [locked, setLocked] = useState(true);
  const [covered, setCovered] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const leftAt = useRef<number | null>(null);
  const lockMs = useRef(settings.autoLockMin * 60_000);
  lockMs.current = settings.autoLockMin * 60_000;

  async function authenticate() {
    if (busy.current) return;
    busy.current = true;
    setFailed(false);
    try {
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) { setLocked(false); return; }
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Rounds',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });
      if (r.success) setLocked(false); else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
    }
  }

  useEffect(() => { authenticate(); }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {
        setCovered(false);
        if (leftAt.current !== null && Date.now() - leftAt.current >= lockMs.current) {
          setLocked(true);
          authenticate();
        }
        leftAt.current = null;
      } else if (next === 'background') {
        setCovered(true);
        if (leftAt.current === null) leftAt.current = Date.now();
      } else {
        // 'inactive': app switcher, Control Center, or our own Face ID sheet
        if (!busy.current) setCovered(true);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {(locked || covered) && (
        <View style={[StyleSheet.absoluteFill, st.cover]}>
          <View style={st.badge}><Icon name="lock" size={26} /></View>
          <Text style={st.name}>Rounds</Text>
          {locked && !covered && (
            <>
              {failed && <Text style={st.err}>Not unlocked. Try again.</Text>}
              <Pressable style={({ pressed }) => [st.btn, pressed && { opacity: 0.85 }]} onPress={authenticate}>
                <Text style={st.btnText}>Unlock</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  cover: { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: S.md, paddingHorizontal: 40, zIndex: 10000, elevation: 10000 },
  badge: { width: 64, height: 64, borderRadius: R.lg, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  name:  { ...T.h2, marginBottom: S.lg },
  err:   { ...T.small, color: C.high },
  btn:   { backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center' },
  btnText: { ...T.bodyM, color: C.onInk },
});
