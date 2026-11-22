/**
 * AuthGate — wraps the entire app.
 *
 * Requires the user to authenticate with Face ID / Touch ID / device passcode:
 *   • Every cold launch
 *   • Every time the app returns from the background
 *
 * If the device has no biometrics enrolled the system falls back to
 * the device passcode automatically (iOS behaviour).
 */
import { useEffect, useRef, useState, ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, AppState, AppStateStatus, StyleSheet,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { StatusBar } from 'expo-status-bar';

type Props = { children: ReactNode };

export default function AuthGate({ children }: Props) {
  const [unlocked, setUnlocked]   = useState(false);
  const [error, setError]         = useState(false);
  const appState                  = useRef<AppStateStatus>(AppState.currentState);
  const isAuthenticating          = useRef(false);   // prevent re-entrant calls

  // Auth on mount (cold launch)
  useEffect(() => {
    authenticate();
  }, []);

  // Re-lock only when fully backgrounded; re-auth when returning from background.
  // Important: iOS fires 'inactive' whenever a system sheet (Face ID, passcode)
  // appears — ignoring that state prevents the infinite re-auth loop.
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'background') {
        // Fully backgrounded → lock
        setUnlocked(false);
      } else if (next === 'active' && appState.current === 'background') {
        // Returned from background (not just from a system sheet) → re-auth
        authenticate();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  async function authenticate() {
    if (isAuthenticating.current) return;   // don't stack calls
    isAuthenticating.current = true;
    setError(false);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Rounds',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: '',
      });
      if (result.success) {
        setUnlocked(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      isAuthenticating.current = false;
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <View style={s.screen}>
      <StatusBar style="dark" />
      <View style={s.lockIcon}>
        <Text style={s.lockEmoji}>🔒</Text>
      </View>
      <Text style={s.appName}>Rounds</Text>
      <Text style={s.subtitle}>Patient data is protected</Text>

      {error && (
        <Text style={s.errorMsg}>Authentication failed</Text>
      )}

      <TouchableOpacity style={s.unlockBtn} onPress={authenticate} activeOpacity={0.8}>
        <Text style={s.unlockBtnText}>Unlock with Face ID / Passcode</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  lockEmoji:  { fontSize: 36 },
  appName:    { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  subtitle:   { fontSize: 14, color: '#999', marginBottom: 24 },
  errorMsg:   { fontSize: 13, color: '#E24B4A', marginBottom: 4 },
  unlockBtn: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  unlockBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
