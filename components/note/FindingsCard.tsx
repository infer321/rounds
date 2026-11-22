import { memoData } from '../../utils/memo';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from '../Icon';
import NoteField from './NoteField';
import { C, T, R, S } from '../../theme';

type Props = {
  lines: string[];          // already formatted (see utils/noteExport)
  emptyText: string;
  onOpen: () => void;
  note: string;
  onNote: (v: string) => void;
  notePlaceholder: string;
};

/** Read-only summary of a structured builder, rendered the way it will print. */
function FindingsCard({ lines, emptyText, onOpen, note, onNote, notePlaceholder }: Props) {
  return (
    <View style={st.card}>
      <Pressable onPress={onOpen} style={({ pressed }) => [st.head, pressed && { opacity: 0.6 }]}>
        <View style={{ flex: 1, gap: 3 }}>
          {lines.length ? lines.map((l, i) => {
            const idx = l.indexOf(': ');
            return idx > 0 && idx < 16 ? (
              <Text key={i} style={st.line}><Text style={st.key}>{l.slice(0, idx)}  </Text>{l.slice(idx + 2)}</Text>
            ) : <Text key={i} style={st.line}>{l}</Text>;
          }) : <Text style={st.empty}>{emptyText}</Text>}
        </View>
        <Icon name="chevron" size={18} color={C.ink4} />
      </Pressable>
      <View style={st.divider} />
      <NoteField bare value={note} onCommit={onNote} placeholder={notePlaceholder} minHeight={32} />
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md + 2, paddingVertical: S.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  line: { ...T.small, color: C.ink, lineHeight: 19 },
  key:  { fontWeight: '600', color: C.ink2 },
  empty:{ ...T.small, color: C.ink3 },
  divider: { height: 0.5, backgroundColor: C.line, marginTop: S.md },
});

export default memoData(FindingsCard);
