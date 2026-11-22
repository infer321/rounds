/**
 * I-PASS signout for the whole list:
 *   I  Illness severity   (Stable / Watcher / Unstable)
 *   P  Patient summary
 *   A  Action list        (items flagged for signout; check off when handed off)
 *   S  Situation awareness / contingency ("if X, then Y")
 * "Copy" puts the whole handoff on the clipboard as plain text.
 */
import { StyleSheet, Text, View, ScrollView, Pressable, ColorValue } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Patient, Severity } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useToast } from '../context/ToastContext';
import { useNow } from '../hooks/useNow';
import { buildSignout, oneLiner } from '../utils/noteExport';
import { formatCountdown } from '../utils/time';
import { tap, success } from '../utils/haptics';
import Icon from '../components/Icon';
import NoteField from '../components/note/NoteField';
import { Screen, ScreenHeader, EmptyState, Segmented } from '../components/ui';
import { C, T, R, S } from '../theme';

const SEVERITY = [['Stable', 'Stable'], ['Watcher', 'Watcher'], ['Unstable', 'Unstable']] as const;
const SEV_COLOR: Record<Severity, ColorValue> = { Stable: C.ok, Watcher: C.flag, Unstable: C.high };

function PatientHandoff({ p, now }: { p: Patient; now: number }) {
  const { toggleHandedOff, toggleSignout, patchIPass } = usePatients();
  const toast = useToast();
  const ip = p.ipass ?? {};
  const items = p.items.filter(i => i.signout);

  return (
    <View style={[st.group, ip.severity && { borderLeftColor: SEV_COLOR[ip.severity], borderLeftWidth: 3 }]}>
      <View style={st.groupHead}>
        <Text style={st.initials}>{p.initials}</Text>
        <Text style={[T.small, { flex: 1 }]} numberOfLines={1}>{oneLiner(p)}</Text>
      </View>
      <View style={st.pad}>
        <Segmented options={SEVERITY} value={ip.severity} onChange={v => patchIPass(p.id, { severity: v })} allowNone size="sm" />
      </View>
      <View style={st.field}>
        <Text style={st.label}>Summary</Text>
        <NoteField bare value={ip.summary ?? ''} onCommit={v => patchIPass(p.id, { summary: v })} placeholder="Where they are in their course" minHeight={28} />
      </View>
      {items.map(i => {
        const cd = i.endsAt ? formatCountdown(i.endsAt, now) : null;
        return (
          <Pressable key={i.id} style={st.row}
            onPress={() => { tap(); toggleHandedOff(p.id, i.id); }}
            onLongPress={() => {
              tap(); toggleSignout(p.id, i.id);
              toast({ message: `Removed from signout: ${i.label}`, onUndo: () => toggleSignout(p.id, i.id) });
            }}
            accessibilityRole="checkbox" accessibilityState={{ checked: !!i.handedOff }}>
            <View style={[st.box, i.handedOff && st.boxOn]}>{i.handedOff && <Icon name="check" size={13} color={C.onInk} strokeWidth={2.5} />}</View>
            <Text style={[T.body, { flex: 1 }, i.handedOff && st.struck]}>{i.label}</Text>
            {cd && <Text style={[st.due, cd.isUrgent && { color: C.high }]}>{cd.isOverdue ? 'overdue' : cd.display}</Text>}
          </Pressable>
        );
      })}
      <View style={[st.field, st.divTop]}>
        <Text style={st.label}>If / then</Text>
        <NoteField bare value={ip.contingency ?? ''} onCommit={v => patchIPass(p.id, { contingency: v })} placeholder="If SBP <90, hold diuretic and page" minHeight={28} />
      </View>
    </View>
  );
}

export default function SignoutScreen() {
  const { patients } = usePatients();
  const toast = useToast();
  const now = useNow(15_000);

  const flagged = patients.flatMap(p => p.items.filter(i => i.signout));
  const done = flagged.filter(i => i.handedOff).length;

  async function copy() {
    await Clipboard.setStringAsync(buildSignout(patients));
    success();
    toast({ message: 'I-PASS signout copied. Paste into Teams.' });
  }

  return (
    <Screen>
      <ScreenHeader title="Signout" subtitle={flagged.length ? `I-PASS · ${done}/${flagged.length} to-dos handed off` : 'I-PASS'}
        right={patients.length > 0 && (
          <Pressable onPress={copy} style={({ pressed }) => [st.copy, pressed && { opacity: 0.85 }]} accessibilityLabel="Copy signout">
            <Icon name="copy" size={16} color={C.onInk} strokeWidth={2} />
            <Text style={[T.bodyM, { color: C.onInk, fontSize: 14 }]}>Copy</Text>
          </Pressable>
        )} />

      {patients.length === 0 ? (
        <EmptyState title="No patients" body="Add patients to build a signout." />
      ) : (
        <ScrollView contentContainerStyle={st.list} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {patients.map(p => <PatientHandoff key={p.id} p={p} now={now} />)}
          <Text style={st.hint}>Flag timers or tasks to add to-dos. Tap a to-do to check it off; long-press to remove it.</Text>
        </ScrollView>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  copy:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.ink, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 8 },
  list:   { paddingHorizontal: S.lg, gap: S.md, paddingBottom: 80 },
  group:  { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.line, overflow: 'hidden' },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: S.sm, paddingHorizontal: S.lg, paddingTop: S.md },
  initials: { fontSize: 15, fontWeight: '700', color: C.ink, letterSpacing: 0.4 },
  pad:    { paddingHorizontal: S.lg, paddingTop: S.sm },
  field:  { paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.sm },
  divTop: { borderTopWidth: 0.5, borderTopColor: C.line },
  label:  { ...T.label, fontSize: 10 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: C.line },
  box:    { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.flag, alignItems: 'center', justifyContent: 'center' },
  boxOn:  { backgroundColor: C.ok, borderColor: C.ok },
  struck: { color: C.ink3, textDecorationLine: 'line-through' },
  due:    { ...T.caption, ...T.num },
  hint:   { ...T.caption, color: C.ink4, textAlign: 'center' },
});
