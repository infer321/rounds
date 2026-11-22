/**
 * Local text state for a long note field, committed upstream after a pause,
 * and always on blur, unmount and app-background. Keeps typing at native
 * speed: the patient tree (and the encrypted save) isn't re-run per keystroke.
 * All returned functions are stable across renders.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export function useBufferedText(value: string, commit: (v: string) => void, delay = 1000) {
  const [text, setTextState] = useState(value);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focused = useRef(false);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (pending.current !== null) { commitRef.current(pending.current); pending.current = null; }
  }, []);

  const setText = useCallback((v: string) => {
    setTextState(v);
    pending.current = v;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, delay);
  }, [flush, delay]);

  const onFocus = useCallback(() => { focused.current = true; }, []);
  const onBlur = useCallback(() => { focused.current = false; flush(); }, [flush]);

  // Accept outside changes (builder screens, Complete round) while idle
  useEffect(() => { if (!focused.current && pending.current === null) setTextState(value); }, [value]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s !== 'active') flush(); });
    return () => { sub.remove(); flush(); };
  }, [flush]);

  return { text, setText, onFocus, onBlur, flush };
}
