/**
 * APInput — Assessment / Plan rich-input
 *
 * Performance: uses LOCAL state while focused (fast local re-renders).
 *   Parent `onChange` is only called on blur — no re-render chain per keystroke.
 *
 * Live bold: transparent TextInput over a styled View.
 *   Overlay wrapper is a <View> so Text children are block-level (no inline collapse).
 *
 * Autocomplete:
 *   • Lab values  — prefix match on lab abbreviations (e.g. "n" → Na)
 *   • Vitals      — T, HR, RR, BP, O2 typed → show from hp.vitals
 *   • Imaging     — xr/ct/mri/us/echo typed → show documented studies
 *   • PE findings — "pe" / "exam" typed → exam findings
 *
 * '#' key added to toolbar only while this input is focused.
 * Re-centers scroll view whenever a new line is typed.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useKbCtx, Suggestion } from '../context/KeyboardContext';
import { Labs, HAndP, Vitals } from '../data/patients';
import { EXAM_SECTIONS } from '../data/examSections';

// ── Lab triggers ───────────────────────────────────────────────────────────

const LAB_ALIAS: Record<string, keyof Labs> = {
  na: 'na',   sodium: 'na',
  k:  'k',    potassium: 'k',
  cl: 'cl',   chloride: 'cl',
  co2: 'co2', bicarb: 'co2', hco3: 'co2',
  bun: 'bun',
  cr:  'cr',  creatinine: 'cr',
  glu: 'glu', glucose: 'glu',
  wbc: 'wbc',
  hgb: 'hgb', hb: 'hgb',
  hct: 'hct',
  plt: 'plt',  plts: 'plt', platelets: 'plt',
  ca:  'ca',   calcium: 'ca',
  po4: 'po4',  phos: 'po4', phosphorus: 'po4',
  tp:  'tp',
  alb: 'alb',  albumin: 'alb',
  ast: 'ast',
  alt: 'alt',
  ldh: 'ldh',
  bili: 'bili', bilirubin: 'bili',
};

const LAB_LABEL: Partial<Record<keyof Labs, string>> = {
  na: 'Na',   k: 'K',    cl: 'Cl',   co2: 'HCO₃',
  bun: 'BUN', cr: 'Cr',  glu: 'Glu',
  wbc: 'WBC', hgb: 'Hgb', hct: 'HCT', plt: 'Plts',
  ca: 'Ca',   po4: 'PO₄', tp: 'TP',   alb: 'Alb',
  ast: 'AST', alt: 'ALT', ldh: 'LDH', ap: 'AP',  bili: 'Bili',
};

// ── Vitals triggers ────────────────────────────────────────────────────────
// Maps typed prefix → vital key(s)
type VitKey = 't' | 'hr' | 'rr' | 'bp' | 'o2';

const VIT_ALIAS: Record<string, VitKey> = {
  t:    't',    temp: 't',  temperature: 't',
  hr:   'hr',   pulse: 'hr', 'heart rate': 'hr',
  rr:   'rr',   resp: 'rr', 'respiratory rate': 'rr',
  bp:   'bp',   'blood pressure': 'bp',
  o2:   'o2',   sat: 'o2',  spo2: 'o2',  o2sat: 'o2', spO2: 'o2',
};

function buildVitalsSuggestion(
  vk: VitKey,
  vitals: Vitals,
  wordStart: number,
): Suggestion | null {
  switch (vk) {
    case 't': {
      if (!vitals.temp) return null;
      const s = `T ${vitals.temp}°C`;
      return { label: s, insert: s, replaceFrom: wordStart };
    }
    case 'hr': {
      if (!vitals.hr) return null;
      const s = `HR ${vitals.hr}`;
      return { label: s, insert: s, replaceFrom: wordStart };
    }
    case 'rr': {
      if (!vitals.rr) return null;
      const s = `RR ${vitals.rr}`;
      return { label: s, insert: s, replaceFrom: wordStart };
    }
    case 'bp': {
      if (!vitals.bpS && !vitals.bpD) return null;
      const s = `BP ${vitals.bpS ?? '?'}/${vitals.bpD ?? '?'}`;
      return { label: s, insert: s, replaceFrom: wordStart };
    }
    case 'o2': {
      const mode = vitals.o2Mode;
      if (!mode) return null;
      let s: string;
      if (mode === 'RA')    s = 'SpO2 RA';
      else if (mode === 'NC') s = `SpO2 ${vitals.o2Val ?? '?'}L NC`;
      else                    s = `SpO2 BiPAP ${vitals.o2Val ?? '?'}`;
      return { label: s, insert: s, replaceFrom: wordStart };
    }
  }
}

// ── Imaging triggers ───────────────────────────────────────────────────────
// Modality abbreviations that can trigger imaging autocomplete
const IMG_ALIAS: Record<string, string[]> = {
  xr:    ['XR'],  xray: ['XR'], cxr: ['XR'],
  ct:    ['CT'],
  mri:   ['MRI'],
  us:    ['US'],  ultrasound: ['US'], echo: ['ECHO', 'US'],
  img:   [],      imaging: [],        rad: [],   // show ALL studies
};

// ── Component ──────────────────────────────────────────────────────────────

type Props = {
  value:        string;
  onChange:     (v: string) => void;
  hp:           HAndP;
  style?:       object;
  placeholder?: string;
  /** Call to trigger scroll-to-center in the parent (on focus + new line) */
  onFocused?:   () => void;
};

const BORDER    = '#D8D8D8';
const BG        = '#fff';
const PADDING_H = 14;
const PADDING_V = 12;
const FONT_SIZE  = 14;
const LINE_H     = 21;

export default function APInput({ value, onChange, hp, style, placeholder, onFocused }: Props) {
  const { registerInsert, setSuggestions, setExtraKeys } = useKbCtx();
  const inputRef   = useRef<TextInput>(null);
  const selRef     = useRef({ start: value.length, end: value.length });
  const localRef   = useRef(value);          // current text (fast path, no re-render)
  const prevLinesRef = useRef(value.split('\n').length);

  // LOCAL state for the TextInput value while focused.
  // Parent onChange only fires on blur — eliminates the parent→child re-render loop.
  const [localValue, setLocalValue] = useState(value);
  const [focused,    setFocused]    = useState(false);

  // Sync incoming prop when NOT focused (e.g., patient switch or initial load)
  useEffect(() => {
    if (!focused) {
      setLocalValue(value);
      localRef.current = value;
      prevLinesRef.current = value.split('\n').length;
    }
  }, [value, focused]);

  // ── Insert handler ─────────────────────────────────────────────────────

  const insertFn = useCallback((str: string, replaceFrom?: number) => {
    const sel   = selRef.current;
    const start = replaceFrom !== undefined ? replaceFrom : sel.start;
    const end   = sel.end;
    const v     = localRef.current;
    const newVal = v.slice(0, start) + str + v.slice(end);
    localRef.current = newVal;
    setLocalValue(newVal);
    selRef.current = { start: start + str.length, end: start + str.length };
  }, []);

  // ── Suggestion detection ───────────────────────────────────────────────
  // Called from onChangeText with cursor at text.length (most common case).
  // Only runs when text changes (not on cursor move) to avoid double-firing.

  function detectSuggestions(text: string, cursorPos: number) {
    const labs    = hp.labs    ?? {};
    const vitals  = hp.vitals  ?? {};
    const studies = hp.imagingStudies ?? [];
    const before  = text.slice(0, cursorPos);

    const lastWordMatch = before.match(/(\S+)$/);
    const lastWord      = (lastWordMatch?.[1] ?? '').toLowerCase();
    const wordStart     = lastWordMatch ? cursorPos - lastWordMatch[1].length : cursorPos;

    if (!lastWord) { setSuggestions([]); return; }

    const wordList = before.trim().split(/\s+/);
    const last2    = wordList.slice(-2).join(' ').toLowerCase();
    const last3    = wordList.slice(-3).join(' ').toLowerCase();

    // ── PE trigger ──────────────────────────────────────────────────────
    const isPE = lastWord === 'pe' || lastWord === 'exam'
      || last2 === 'physical exam' || last3 === 'physical exam'
      || last2 === 'physical examination';

    if (isPE) {
      const sugg: Suggestion[] = [];
      const ef = hp.examFindings ?? {};
      EXAM_SECTIONS.forEach(sec =>
        sec.findings.forEach(f => {
          const state = ef[`${sec.key}_${f.key}`];
          if (state === 'pos') sugg.push({ label: `+${f.pos}`, insert: f.pos,         replaceFrom: wordStart });
          if (state === 'neg') sugg.push({ label: `−${f.neg}`, insert: `no ${f.neg}`, replaceFrom: wordStart });
        })
      );
      if (sugg.length > 0) { setSuggestions(sugg.slice(0, 10)); return; }
    }

    // ── Vitals trigger — prefix match ────────────────────────────────────
    {
      const seen = new Set<VitKey>();
      const sugg: Suggestion[] = [];
      for (const [alias, vk] of Object.entries(VIT_ALIAS)) {
        if (alias.startsWith(lastWord) && !seen.has(vk)) {
          seen.add(vk);
          const s = buildVitalsSuggestion(vk, vitals, wordStart);
          if (s) sugg.push(s);
        }
      }
      if (sugg.length > 0) { setSuggestions(sugg.slice(0, 6)); return; }
    }

    // ── Imaging trigger — prefix match ────────────────────────────────────
    if (studies.length > 0) {
      for (const [alias, modalities] of Object.entries(IMG_ALIAS)) {
        if (alias.startsWith(lastWord)) {
          // filter studies by modality (empty array = all)
          const matches = modalities.length === 0
            ? studies
            : studies.filter(s => modalities.includes(s.modality.toUpperCase()));
          if (matches.length > 0) {
            const sugg: Suggestion[] = matches.map(s => {
              const loc  = [s.bodyPart, s.laterality].filter(Boolean).join(' ');
              const lbl  = `${s.modality} ${loc}`;
              const ins  = `${s.modality} ${loc}: ${s.findings}`;
              return { label: lbl, insert: ins, replaceFrom: wordStart };
            });
            setSuggestions(sugg.slice(0, 8));
            return;
          }
        }
      }
    }

    // ── Lab trigger — prefix match ────────────────────────────────────────
    {
      const seen = new Set<keyof Labs>();
      const sugg: Suggestion[] = [];
      for (const [alias, labKey] of Object.entries(LAB_ALIAS)) {
        if (alias.startsWith(lastWord) && labs[labKey] && !seen.has(labKey)) {
          seen.add(labKey);
          const lbl = LAB_LABEL[labKey] ?? labKey.toUpperCase();
          sugg.push({
            label:       `${lbl} ${labs[labKey]}`,
            insert:      `${lbl} ${labs[labKey]}`,
            replaceFrom: wordStart,
          });
        }
      }
      if (sugg.length > 0) { setSuggestions(sugg.slice(0, 8)); return; }
    }

    setSuggestions([]);
  }

  // ── Line renderer ──────────────────────────────────────────────────────
  // Returns array of Text blocks. Must live inside a <View> (block layout),
  // NOT a <Text> (which would make children inline → all on one line).

  function renderLines(text: string): React.ReactNode {
    if (!text) {
      return <Text style={[st.fmtLine, { color: '#CCC' }]}>{placeholder}</Text>;
    }
    return text.split('\n').map((line, i) => (
      <Text key={i} style={/^#+/.test(line) ? [st.fmtLine, st.fmtHeader] : st.fmtLine}>
        {line || ' '}
      </Text>
    ));
  }

  // ── Focus / blur ───────────────────────────────────────────────────────

  function handleFocus() {
    setFocused(true);
    registerInsert(insertFn);
    setExtraKeys(['#']);
    prevLinesRef.current = localRef.current.split('\n').length;
    onFocused?.();
  }

  function handleBlur() {
    setTimeout(() => {
      onChange(localRef.current);   // flush local text to parent ONCE on blur
      setFocused(false);
      registerInsert(null);
      setExtraKeys([]);
    }, 150);
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={[st.container, style]}>
      {focused ? (
        <View style={st.editWrapper}>
          {/* Styled text drives height (block-level View children) */}
          <View style={st.overlayContent} pointerEvents="none">
            {renderLines(localValue)}
          </View>

          {/* Transparent TextInput on top — cursor visible, text hidden */}
          <TextInput
            ref={inputRef}
            style={st.transparentInput}
            value={localValue}
            onChangeText={text => {
              localRef.current = text;
              setLocalValue(text);           // local update only (fast — no parent re-render)

              detectSuggestions(text, text.length);

              // Re-center when a new line is added (Enter key pressed)
              const newLines = text.split('\n').length;
              if (newLines > prevLinesRef.current) {
                prevLinesRef.current = newLines;
                onFocused?.();               // triggers scroll-to-center in parent
              }
            }}
            onSelectionChange={e => {
              selRef.current = e.nativeEvent.selection;
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline
            blurOnSubmit={false}
            textAlignVertical="top"
            autoFocus
          />
        </View>
      ) : (
        <TouchableOpacity onPress={() => setFocused(true)} activeOpacity={0.85}>
          <View style={st.preview}>{renderLines(localValue)}</View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BORDER,
    minHeight: 120,
    overflow: 'hidden',
  },
  editWrapper: { minHeight: 120 },

  // View wrapper — children are block elements, not inline.
  overlayContent: {
    paddingHorizontal: PADDING_H,
    paddingVertical:   PADDING_V,
    minHeight: 120,
  },

  // Transparent TextInput — absolutely fills overlayContent,
  // cursor is visible (tint color), text is invisible.
  transparentInput: {
    position:   'absolute',
    top:        0, left: 0, right: 0, bottom: 0,
    paddingHorizontal: PADDING_H,
    paddingVertical:   PADDING_V,
    fontSize:   FONT_SIZE,
    lineHeight: LINE_H,
    color:      'transparent',
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
  },

  preview: {
    paddingHorizontal: PADDING_H,
    paddingVertical:   PADDING_V,
    minHeight: 120,
  },

  fmtLine: {
    fontSize:   FONT_SIZE,
    color:      '#1C1C1E',
    lineHeight: LINE_H,
  },
  fmtHeader: {
    fontWeight: '700',
    fontSize:   15,
    lineHeight: LINE_H,
    marginTop:  4,
    color:      '#1C1C1E',
  },
});
