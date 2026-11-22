/**
 * Local text state for a long note field, committed upstream after a short
 * pause and always on blur/unmount. Keeps typing at native speed: the
 * whole patient tree (and the encrypted save) isn't re-run per keystroke.
 */
import { useEffect, useRef, useState } from 'react';

export function useBufferedText(value: string, commit: (v: string) => void, delay = 300) {
  const [text, setText] = useState(value);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focused = useRef(false);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const flush = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (pending.current !== null) { commitRef.current(pending.current); pending.current = null; }
  };

  // Accept outside changes (e.g. builder screens, Complete round) when idle
  useEffect(() => { if (!focused.current && pending.current === null) setText(value); }, [value]);
  useEffect(() => flush, []);

  return {
    text,
    setText: (v: string) => {
      setText(v);
      pending.current = v;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    onFocus: () => { focused.current = true; },
    onBlur: () => { focused.current = false; flush(); },
    flush,
  };
}
