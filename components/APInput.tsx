/**
 * Assessment & Plan editor.
 *
 * Lines starting with "#" render bold (problem headers). The trick: a
 * transparent TextInput sits over a styled Text overlay that draws the same
 * text, so you get rich display with native editing. Both use identical
 * font size and line height so the caret lines up.
 *
 * Typing is buffered locally and committed upstream after a pause, on blur,
 * on unmount and when the app backgrounds (see useBufferedText).
 * Autocomplete chips come from utils/apSuggestions.
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useKbCtx } from '../context/KeyboardContext';
import { HAndP } from '../data/patients';
import { useBufferedText } from '../hooks/useBufferedText';
import { suggestionsFor } from '../utils/apSuggestions';
import { C, R, S } from '../theme';

const FONT_SIZE = 15;
const LINE_H = 21;
const MIN_H = 120;

type Props = {
  value: string;
  onChange: (v: string) => void;
  hp: HAndP;
  placeholder?: string;
  onFocused?: () => void;   // parent re-centers the field (on focus + each new line)
};

function Lines({ text, placeholder }: { text: string; placeholder?: string }) {
  if (!text) return <Text style={[st.line, { color: C.ink4 }]}>{placeholder}</Text>;
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Text key={i} style={line.startsWith('#') ? [st.line, st.header] : st.line}>{line || ' '}</Text>
      ))}
    </>
  );
}

export default function APInput({ value, onChange, hp, placeholder, onFocused }: Props) {
  const { registerInsert, setSuggestions, setExtraKeys } = useKbCtx();
  const buf = useBufferedText(value, onChange, 1200);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sel = useRef({ start: value.length, end: value.length });
  const text = useRef(buf.text);
  const lineCount = useRef(buf.text.split('\n').length);
  const hpRef = useRef(hp);
  text.current = buf.text;
  hpRef.current = hp;

  const setText = buf.setText;
  const apply = useCallback((next: string, caret: number) => {
    text.current = next;
    sel.current = { start: caret, end: caret };
    setText(next);
    setSuggestions(suggestionsFor(next, caret, hpRef.current));
    const n = next.split('\n').length;
    if (n > lineCount.current) onFocused?.();
    lineCount.current = n;
  }, [setText, setSuggestions, onFocused]);

  // Toolbar chip / key insert
  const insert = useCallback((str: string, replaceFrom?: number) => {
    const start = replaceFrom ?? sel.current.start;
    const next = text.current.slice(0, start) + str + text.current.slice(sel.current.end);
    const caret = start + str.length;
    apply(next, caret);
    requestAnimationFrame(() => inputRef.current?.setSelection?.(caret, caret));
  }, [apply]);

  function onChangeText(next: string) {
    // onChangeText fires before onSelectionChange: estimate the caret from the length change
    const caret = Math.max(0, Math.min(next.length, sel.current.end + (next.length - text.current.length)));
    apply(next, caret);
  }

  function onFocus() {
    buf.onFocus();
    registerInsert(insert);
    setExtraKeys(['#', '-']);
    lineCount.current = text.current.split('\n').length;
    onFocused?.();
  }

  function onBlur() {
    buf.onBlur();
    setTimeout(() => { setEditing(false); registerInsert(null); setExtraKeys([]); }, 150);
  }

  useEffect(() => () => { registerInsert(null); setExtraKeys([]); }, [registerInsert, setExtraKeys]);

  if (!editing) {
    return (
      <Pressable style={st.box} onPress={() => setEditing(true)}>
        <View style={st.pad}><Lines text={buf.text} placeholder={placeholder} /></View>
      </Pressable>
    );
  }

  return (
    <View style={st.box}>
      <View style={st.pad} pointerEvents="none"><Lines text={buf.text} placeholder={placeholder} /></View>
      <TextInput
        ref={inputRef}
        style={st.input}
        value={buf.text}
        onChangeText={onChangeText}
        onSelectionChange={e => { sel.current = e.nativeEvent.selection; }}
        onFocus={onFocus}
        onBlur={onBlur}
        multiline
        submitBehavior="newline"
        textAlignVertical="top"
        autoFocus
      />
    </View>
  );
}

const st = StyleSheet.create({
  box:    { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, minHeight: MIN_H, overflow: 'hidden' },
  pad:    { paddingHorizontal: S.md + 2, paddingVertical: S.md, minHeight: MIN_H },
  line:   { fontSize: FONT_SIZE, lineHeight: LINE_H, color: C.ink },
  header: { fontWeight: '700' },
  input:  {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: S.md + 2, paddingVertical: S.md,
    fontSize: FONT_SIZE, lineHeight: LINE_H,
    color: 'transparent', backgroundColor: 'transparent',
  },
});
