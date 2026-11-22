import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../App';
import { Patient } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useNow } from '../hooks/useNow';
import { formatCountdown, sortItemsByUrgency } from '../utils/time';
import { ageSex } from '../utils/clinical';
import { tap, thud } from '../utils/haptics';
import Sheet, { Btn } from '../components/Sheet';
import Icon from '../components/Icon';
import TabBar from '../components/TabBar';
import PatientForm, { usePatientDraft } from '../components/PatientForm';
import { EmptyState } from '../components/ui';
import { C, T, R, S } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function today() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function PatientCard({ p, now, onPress, onLongPress }: { p: Patient; now: number; onPress: () => void; onLongPress: () => void }) {
  const items = sortItemsByUrgency(p.items, now);
  const overdue = items.some(i => i.endsAt && i.endsAt <= now);
  const as = ageSex(p.age, p.gender);
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={450}
      style={({ pressed }) => [st.card, overdue && st.cardHot, pressed && { transform: [{ scale: 0.985 }], backgroundColor: C.bg }]}>
      <View style={st.cardHead}>
        <Text style={st.initials}>{p.initials}</Text>
        {!!as && <Text style={st.as}>{as}</Text>}
      </View>
      <Text style={[st.desc, !p.descriptor && { color: C.ink4 }]} numberOfLines={1}>{p.descriptor || 'No descriptor'}</Text>
      <View style={st.items}>
        {items.slice(0, 3).map(i => {
          const cd = i.endsAt ? formatCountdown(i.endsAt, now) : null;
          return (
            <View key={i.id} style={st.item}>
              {i.signout ? <Icon name="flag" size={11} color={C.flag} strokeWidth={2.25} /> : <View style={[st.dot, cd?.isUrgent && { backgroundColor: C.high }]} />}
              <Text style={[st.itemLabel, cd?.isUrgent && { color: C.high }]} numberOfLines={1}>{i.label}</Text>
              {cd && <Text style={[st.itemTime, cd.isUrgent && { color: C.high, fontWeight: '600' }]}>{cd.isOverdue ? 'due' : cd.display}</Text>}
            </View>
          );
        })}
        {items.length > 3 && <Text style={st.more}>+{items.length - 3} more</Text>}
        {items.length === 0 && <Text style={st.more}>Nothing pending</Text>}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { patients, addPatient, deletePatient, restorePatient, loadError } = usePatients();
  const { settings } = useSettings();
  const toast = useToast();
  const now = useNow();

  const [adding, setAdding] = useState(false);
  const form = usePatientDraft();
  const [actionFor, setActionFor] = useState<Patient | null>(null);

  const allItems = patients.flatMap(p => p.items);
  const overdue = allItems.filter(i => i.endsAt && i.endsAt <= now).length;
  const soon = allItems.filter(i => i.endsAt && i.endsAt > now && i.endsAt - now < 30 * 60_000).length;
  const summary = [
    `${patients.length} patient${patients.length === 1 ? '' : 's'}`,
    overdue ? `${overdue} overdue` : null,
    soon ? `${soon} due in 30 min` : null,
  ].filter(Boolean).join('  ·  ');

  const empties = Math.max(0, settings.slotCount - patients.length);

  function openAdd() { form.reset(); setAdding(true); }
  function add() {
    if (!form.valid) return;
    thud();
    const id = addPatient(form.draft);
    setAdding(false);
    navigation.navigate('Patient', { patientId: id });
  }
  function remove(p: Patient) {
    const idx = patients.findIndex(x => x.id === p.id);
    setActionFor(null);
    const removed = deletePatient(p.id);
    if (removed) toast({ message: `Removed ${p.initials}`, onUndo: () => restorePatient(removed, idx) });
  }

  return (
    <View style={[st.screen, { paddingTop: insets.top + S.md }]}>
      <StatusBar style="dark" />
      <View style={st.top}>
        <View style={{ flex: 1 }}>
          <Text style={T.caption}>{today()}</Text>
          <Text style={[T.title, { marginTop: 2 }]}>Patients</Text>
        </View>
        <Pressable onPress={openAdd} hitSlop={8} style={({ pressed }) => [st.addBtn, pressed && { opacity: 0.85 }]} accessibilityLabel="Add patient">
          <Icon name="plus" size={20} color="#fff" strokeWidth={2.25} />
        </Pressable>
      </View>
      {patients.length > 0 && <Text style={[st.summary, overdue > 0 && { color: C.high }]}>{summary}</Text>}

      {loadError && (
        <View style={st.banner}>
          <Text style={[T.small, { color: C.high }]}>Saved data on this device couldn't be read. It was kept aside, not deleted.</Text>
        </View>
      )}

      {patients.length === 0 ? (
        <EmptyState title="No patients yet"
          body={'Add each patient by initials, age and a one-liner.\nEverything stays encrypted on this phone.'}
          action={<Btn label="Add patient" onPress={openAdd} />} />
      ) : (
        <ScrollView contentContainerStyle={st.grid} showsVerticalScrollIndicator={false}>
          {patients.map(p => (
            <PatientCard key={p.id} p={p} now={now}
              onPress={() => navigation.navigate('Patient', { patientId: p.id })}
              onLongPress={() => { tap(); setActionFor(p); }} />
          ))}
          {Array.from({ length: empties }).map((_, i) => (
            <Pressable key={`e${i}`} onPress={openAdd} style={({ pressed }) => [st.slot, pressed && { backgroundColor: C.sunken }]}>
              {i === 0 && <Icon name="plus" size={18} color={C.ink4} />}
            </Pressable>
          ))}
        </ScrollView>
      )}

      <TabBar active="patients" />

      <Sheet visible={adding} onClose={() => setAdding(false)} title="New patient"
        footer={<><Btn label="Cancel" kind="secondary" onPress={() => setAdding(false)} /><Btn label="Add patient" onPress={add} disabled={!form.valid} flex={2} /></>}>
        <PatientForm draft={form.draft} set={form.set} onSubmit={add} autoFocus />
      </Sheet>

      <Sheet visible={!!actionFor} onClose={() => setActionFor(null)} title={actionFor?.initials ?? ''}
        subtitle={actionFor ? [ageSex(actionFor.age, actionFor.gender), actionFor.descriptor].filter(Boolean).join(' · ') : ''}>
        <View style={{ gap: S.sm }}>
          <Btn label="Open H&P" kind="secondary" onPress={() => { const p = actionFor!; setActionFor(null); navigation.navigate('Patient', { patientId: p.id, tab: 'hp' }); }} />
          <Btn label="Open SOAP" kind="secondary" onPress={() => { const p = actionFor!; setActionFor(null); navigation.navigate('Patient', { patientId: p.id, tab: 'soap' }); }} />
          <Btn label="Remove patient" kind="danger" onPress={() => actionFor && remove(actionFor)} />
        </View>
      </Sheet>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: S.lg },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  summary: { ...T.small, paddingHorizontal: S.lg, marginTop: 4, marginBottom: S.md },
  banner: { marginHorizontal: S.lg, marginBottom: S.md, padding: S.md, borderRadius: R.md, backgroundColor: C.highBg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.xl, rowGap: S.md },
  card: { width: '48.4%', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.line, padding: S.md, minHeight: 138 },
  cardHot: { borderColor: C.high, borderWidth: 1 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  initials: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5, color: C.ink },
  as: { ...T.small, ...T.num, color: C.ink2, fontWeight: '500' },
  desc: { ...T.small, marginTop: 2 },
  items: { marginTop: S.md, gap: 5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.ink4 },
  itemLabel: { ...T.caption, color: C.ink2, flex: 1, fontWeight: '400' },
  itemTime: { ...T.caption, ...T.num, color: C.ink3 },
  more: { ...T.caption, color: C.ink4, fontWeight: '400' },
  slot: { width: '48.4%', minHeight: 138, borderRadius: R.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
});
