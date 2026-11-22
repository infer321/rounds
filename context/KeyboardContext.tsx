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
import { createContext, useContext, useRef, useCallback, useState, useMemo, ReactNode } from 'react';

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

type KbActions = Pick<KbCtxType, 'registerInsert' | 'doInsert' | 'setSuggestions' | 'setExtraKeys'>;
type KbState = Pick<KbCtxType, 'suggestions' | 'extraKeys' | 'toolbarActive'>;

// Two contexts: text fields only need the (stable) actions, so changing the
// suggestion chips re-renders the toolbar alone, not every field on screen.
const KbActionsCtx = createContext<KbActions>({
  registerInsert: () => {}, doInsert: () => {}, setSuggestions: () => {}, setExtraKeys: () => {},
});
const KbStateCtx = createContext<KbState>({ suggestions: [], extraKeys: [], toolbarActive: false });

const sameSugg = (a: Suggestion[], b: Suggestion[]) =>
  a.length === b.length && a.every((x, i) => x.label === b[i].label && x.insert === b[i].insert && x.replaceFrom === b[i].replaceFrom);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const insertRef = useRef<InsertFn | null>(null);
  const [suggestions,    setSuggestionsState] = useState<Suggestion[]>([]);
  const [extraKeys,      setExtraKeysState]   = useState<string[]>([]);
  const [toolbarActive,  setToolbarActive]    = useState(false);

  const registerInsert = useCallback((fn: InsertFn | null) => {
    insertRef.current = fn;
    setToolbarActive(fn !== null);
    if (fn === null) setSuggestionsState(prev => (prev.length ? [] : prev));
  }, []);

  const doInsert = useCallback((s: string, replaceFrom?: number) => {
    insertRef.current?.(s, replaceFrom);
  }, []);

  const setSuggestions = useCallback((s: Suggestion[]) => {
    setSuggestionsState(prev => (sameSugg(prev, s) ? prev : s));
  }, []);

  const setExtraKeys = useCallback((keys: string[]) => {
    setExtraKeysState(prev => (prev.join('\u0000') === keys.join('\u0000') ? prev : keys));
  }, []);

  const actions = useMemo(() => ({ registerInsert, doInsert, setSuggestions, setExtraKeys }), []);
  const state = useMemo(() => ({ suggestions, extraKeys, toolbarActive }), [suggestions, extraKeys, toolbarActive]);

  return (
    <KbActionsCtx.Provider value={actions}>
      <KbStateCtx.Provider value={state}>{children}</KbStateCtx.Provider>
    </KbActionsCtx.Provider>
  );
}

export const useKbCtx = () => useContext(KbActionsCtx);
export const useKbState = () => useContext(KbStateCtx);
