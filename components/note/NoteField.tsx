import { memoData } from '../../utils/memo';
import { useRef } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useBufferedText } from '../../hooks/useBufferedText';
import { useNoteToolbar } from '../../hooks/useNoteToolbar';
import { C, T, R, S } from '../../theme';

type Props = {
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
  onFocused?: (node: TextInput | null) => void;
  minHeight?: number;
  bare?: boolean;   // no card chrome (used inside another card)
};

/** Multiline note field: buffered typing + number toolbar + auto-centering. */
function NoteField({ value, onCommit, placeholder, onFocused, minHeight = 88, bare }: Props) {
  const ref = useRef<TextInput>(null);
  const buf = useBufferedText(value, onCommit);
  const tb = useNoteToolbar(buf.text, buf.setText, ref);
  return (
    <TextInput
      ref={ref}
      style={[bare ? st.bare : st.card, { minHeight }]}
      value={buf.text}
      onChangeText={buf.setText}
      onSelectionChange={tb.onSelectionChange}
      onFocus={() => { buf.onFocus(); tb.onFocus(); onFocused?.(ref.current); }}
      onBlur={() => { buf.onBlur(); tb.onBlur(); }}
      multiline
      placeholder={placeholder}
      placeholderTextColor={C.ink4}
      textAlignVertical="top"
      scrollEnabled={false}
    />
  );
}

const st = StyleSheet.create({
  card: { ...T.body, lineHeight: 21, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md + 2, paddingTop: S.md, paddingBottom: S.md },
  bare: { ...T.small, color: C.ink, lineHeight: 19, paddingTop: S.sm, paddingHorizontal: 0 },
});

export default memoData(NoteField);
