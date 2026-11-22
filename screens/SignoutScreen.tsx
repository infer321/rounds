/**
 * Signout composer. Every flagged item, grouped by patient, with one button
 * to copy the whole handoff as plain text. Checking an item marks it as
 * handed off (it is NOT deleted, which the old version did).
 */
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { usePatients } from '../context/PatientsContext';
import { useToast } from '../context/ToastContext';
import { useNow } from '../hooks/useNow';
import { buildSignout, oneLiner } from '../utils/noteExport';
import { formatCountdown } from '../utils/time';
import { tap, success } from '../utils/haptics';
import Icon from '../components/Icon';
import { Screen, ScreenHeader, EmptyState } from '../components/ui';
import { C, T, R, S } from '../theme';

export default function SignoutScreen() {
  const { patients, toggleHandedOff, toggleSignout } = usePatients();
  const toast = useToast();
  const now = useNow(15_000);

  const groups = patients.map(p => ({ p, items: p.items.filter(i => i.signout) })).filter(g => g.items.length);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const done = groups.reduce((n, g) => n + g.items.filter(i => i.handedOff).length, 0);

  async function copy() {
    await Clipboard.setStringAsync(buildSignout(patients));
    success();
    toast({ message: 'Signout copied. Paste into Teams.' });
  }

  return (
    <Screen>
      <ScreenHeader title="Signout" subtitle={total ? `${done}/${total} handed off` : 'Nothing flagged'}
        right={total > 0 && (
          <Pressable onPress={copy} style={({ pressed }) => [st.copy, pressed && { opacity: 0.85 }]}>
            <Icon name="copy" size={16} color="#fff" strokeWidth={2} />
            <Text style={[T.bodyM, { color: '#fff', fontSize: 14 }]}>Copy</Text>
          </Pressable>
        )} />

      {total === 0 ? (
        <EmptyState title="No signout items" body="Tap the flag on any timer or task to add it here." />
      ) : (
        <ScrollView contentContainerStyle={st.list} showsVerticalScrollIndicator={false}>
          {groups.map(({ p, items }) => (
            <View key={p.id} style={st.group}>
              <View style={st.groupHead}>
                <Text style={st.initials}>{p.initials}</Text>
                <Text style={[T.small, { flex: 1 }]} numberOfLines={1}>{oneLiner(p)}</Text>
              </View>
              {items.map(i => {
                const cd = i.endsAt ? formatCountdown(i.endsAt, now) : null;
                return (
                  <Pressable key={i.id} style={st.row}
                    onPress={() => { tap(); toggleHandedOff(p.id, i.id); }}
                    onLongPress={() => {
                      tap(); toggleSignout(p.id, i.id);
                      toast({ message: `Removed from signout: ${i.label}`, onUndo: () => toggleSignout(p.id, i.id) });
                    }}>
                    <View style={[st.box, i.handedOff && st.boxOn]}>{i.handedOff && <Icon name="check" size={13} color="#fff" strokeWidth={2.5} />}</View>
                    <Text style={[T.body, { flex: 1 }, i.handedOff && st.struck]}>{i.label}</Text>
                    {cd && <Text style={[st.due, cd.isUrgent && { color: C.high }]}>{cd.isOverdue ? 'overdue' : cd.display}</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))}
          <Text style={st.hint}>Tap to check off. Long-press to remove from signout.</Text>
        </ScrollView>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  copy:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.ink, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 8 },
  list:   { paddingHorizontal: S.lg, gap: S.md, paddingBottom: 60 },
  group:  { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.line, overflow: 'hidden' },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: S.sm, paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.sm },
  initials: { fontSize: 15, fontWeight: '700', color: C.ink, letterSpacing: 0.4 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 13, borderTopWidth: 0.5, borderTopColor: C.line },
  box:    { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.flag, alignItems: 'center', justifyContent: 'center' },
  boxOn:  { backgroundColor: C.ok, borderColor: C.ok },
  struck: { color: C.ink3, textDecorationLine: 'line-through' },
  due:    { ...T.caption, ...T.num },
  hint:   { ...T.caption, color: C.ink4, textAlign: 'center' },
});
