import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Item } from '../../data/patients';
import { formatCountdown } from '../../utils/time';
import { tap } from '../../utils/haptics';
import Icon from '../Icon';
import { C, T, R, S } from '../../theme';

type Props = {
  item: Item; now: number;
  onDone: () => void; onEdit: () => void; onFlag: () => void;
};

export default function ItemRow({ item, now, onDone, onEdit, onFlag }: Props) {
  const cd = item.endsAt ? formatCountdown(item.endsAt, now) : null;
  const hot = cd?.isUrgent;
  return (
    <Pressable onLongPress={() => { tap(); onEdit(); }} delayLongPress={350}
      style={({ pressed }) => [st.row, cd?.isOverdue && st.rowOverdue, pressed && { backgroundColor: C.sunken }]}>
      <Pressable hitSlop={10} onPress={onDone} style={st.check} accessibilityLabel={`Mark ${item.label} done`}>
        <View style={st.ring} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[T.body, hot && st.hotText]} numberOfLines={2}>{item.label}</Text>
        <Text style={st.meta}>{item.type === 'timer' ? 'Timer' : 'Task'}{item.signout ? '  ·  On signout' : ''}</Text>
      </View>
      {cd && (
        <Pressable hitSlop={8} onPress={onEdit} style={[st.time, hot && { backgroundColor: C.highBg }]}>
          <Text style={[st.timeText, hot && { color: C.high }]}>{cd.display}</Text>
        </Pressable>
      )}
      <Pressable hitSlop={10} onPress={() => { tap(); onFlag(); }} accessibilityLabel="Toggle signout flag"
        style={[st.flag, item.signout && { backgroundColor: C.flagBg }]}>
        <Icon name="flag" size={16} color={item.signout ? C.flag : C.ink4} strokeWidth={2} />
      </Pressable>
    </Pressable>
  );
}

const st = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, padding: S.md },
  rowOverdue: { borderColor: C.high },
  check: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.lineStrong },
  hotText: { color: C.high, fontWeight: '600' },
  meta: { ...T.caption, marginTop: 2 },
  time: { backgroundColor: C.sunken, borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 5 },
  timeText: { ...T.caption, ...T.num, color: C.ink, fontWeight: '600', fontSize: 13 },
  flag: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
