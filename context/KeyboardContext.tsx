/**
 * KeyboardContext
 *
 * Provides a shared channel between the global InputAccessoryView toolbar and
 * whichever TextInput is currently focused.
 *
 * Each TextInput that wants toolbar support:
 *   1. Calls registerInsert(fn) on focus   — fn receives a string and inserts it
 *   2. Calls registerInsert(null) on blur  — clears handler + suggestions
 *
 * The A/P input additionally calls setSuggestions() to populate the chip row.
 */
import { createContext, useContext, useRef, useCallback, useState, ReactNode } from 'react';

export type Suggestion = {
  label:        string;  // text shown in chip
  insert:       string;  // text inserted when chip is tapped
  replaceFrom?: number;  // if set, replaces from this index to cursor (removes trigger word)
};

// replaceFrom: when provided, replaces text from that position to the current cursor
type InsertFn = (s: string, replaceFrom?: number) => void;

interface KbCtxType {
  registerInsert: (fn: InsertFn | null) => void;
  doInsert:       (s: string, replaceFrom?: number) => void;
  suggestions:    Suggestion[];
  setSuggestions: (s: Suggestion[]) => void;
  extraKeys:      string[];
  setExtraKeys:   (keys: string[]) => void;
  /** true only when a toolbar-connected text field is focused */
  toolbarActive:  boolean;
}

const KbCtx = createContext<KbCtxType>({
  registerInsert: () => {},
  doInsert:       () => {},
  suggestions:    [],
  setSuggestions: () => {},
  extraKeys:      [],
  setExtraKeys:   () => {},
  toolbarActive:  false,
});

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const insertRef = useRef<InsertFn | null>(null);
  const [suggestions,    setSuggestionsState] = useState<Suggestion[]>([]);
  const [extraKeys,      setExtraKeysState]   = useState<string[]>([]);
  const [toolbarActive,  setToolbarActive]    = useState(false);

  const registerInsert = useCallback((fn: InsertFn | null) => {
    insertRef.current = fn;
    setToolbarActive(fn !== null);
    if (fn === null) setSuggestionsState([]);   // auto-clear on blur
  }, []);

  const doInsert = useCallback((s: string, replaceFrom?: number) => {
    insertRef.current?.(s, replaceFrom);
  }, []);

  const setSuggestions = useCallback((s: Suggestion[]) => {
    setSuggestionsState(s);
  }, []);

  const setExtraKeys = useCallback((keys: string[]) => {
    setExtraKeysState(keys);
  }, []);

  return (
    <KbCtx.Provider value={{ registerInsert, doInsert, suggestions, setSuggestions, extraKeys, setExtraKeys, toolbarActive }}>
      {children}
    </KbCtx.Provider>
  );
}

export const useKbCtx = () => useContext(KbCtx);
