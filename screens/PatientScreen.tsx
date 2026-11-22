import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { ageSex } from '../utils/clinical';
import { tap } from '../utils/haptics';
import TimersTab from '../components/TimersTab';
import NoteEditor from '../components/NoteEditor';
import Sheet, { Btn } from '../components/Sheet';
import Icon from '../components/Icon';
import { C, T, R, S } from '../theme';

type Tab = 'timers' | 'hp' | 'soap';
const TABS: [Tab, string][] = [['timers', 'Timers'], ['hp', 'H&P'], ['soap', 'SOAP']];

export function PatientDetailsFields({ initials, setInitials, age, setAge, sex, setSex, desc, setDesc, onSubmit, autoFocus }: {
  initials: string; setInitials: (v: string) => void; age: string; setAge: (v: string) => void;
  sex: string; setSex: (v: string) => void; desc: string; setDesc: (v: string) => void;
  onSubmit: () => void; autoFocus?: boolean;
}) {
  return (
    <View style={{ gap: S.sm }}>
      <View style={{ flexDirection: 'row', gap: S.sm }}>
        <TextInput style={[st.input, st.initials]} placeholder="ABC" placeholderTextColor={C.ink4}
          value={initials} onChangeText={setInitials} autoFocus={autoFocus} maxLength={3}
          autoCapitalize="characters" autoCorrect={false} accessibilityLabel="Initials" />
        <TextInput style={[st.input, { width: 76, textAlign: 'center' }]} placeholder="Age" placeholderTextColor={C.ink4}
          value={age} onChangeText={t => /^\d*$/.test(t) && setAge(t)} keyboardType="number-pad" maxLength={3} />
        <View style={st.sexSeg}>
          {['M', 'F', 'X'].map(g => (
            <Pressable key={g} style={[st.sexBtn, sex === g && st.sexOn]} onPress={() => { tap(); setSex(sex === g ? '' : g); }}>
              <Text style={[T.bodyM, { color: sex === g ? C.ink : C.ink3 }]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <TextInput style={st.input} placeholder="One-liner, e.g. CHF exacerbation" placeholderTextColor={C.ink4}
        value={desc} onChangeText={setDesc} returnKeyType="done" onSubmitEditing={onSubmit} />
      <Text style={st.note}>Initials, age and a clinical descriptor only. No names, MRNs or DOBs.</Text>
    </View>
  );
}

export default function PatientScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Patient'>>();
  const { patients, editPatient } = usePatients();
  const patient = patients.find(p => p.id === params.patientId);
  const [tab, setTab] = useState<Tab>(params.tab ?? 'timers');

  const [editing, setEditing] = useState(false);
  const [initials, setInitials] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [desc, setDesc] = useState('');

  if (!patient) return null;

  function openEdit() {
    setInitials(patient!.initials); setAge(patient!.age ?? ''); setSex(patient!.gender ?? ''); setDesc(patient!.descriptor ?? '');
    setEditing(true);
  }
  function save() {
    if (!initials.trim()) return;
    editPatient(patient!.id, { initials, age, gender: sex, descriptor: desc });
    setEditing(false);
  }

  const as = ageSex(patient.age, patient.gender);
  const timerCount = patient.items.length;

  return (
    <View style={[st.screen, { paddingTop: insets.top + S.sm }]}>
      <StatusBar style="dark" />
      <View style={st.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={st.iconBtn} accessibilityLabel="Back">
          <Icon name="back" size={22} />
        </Pressable>
        <Pressable onPress={openEdit} style={({ pressed }) => [st.who, pressed && { opacity: 0.6 }]}>
          <View style={st.avatar}><Text style={st.avatarText}>{patient.initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={T.h2} numberOfLines={1}>{[as, patient.descriptor].filter(Boolean).join(' · ') || 'Add details'}</Text>
            <Text style={T.caption}>Tap to edit</Text>
          </View>
        </Pressable>
      </View>

      <View style={st.tabs}>
        {TABS.map(([k, label]) => (
          <Pressable key={k} style={[st.tab, tab === k && st.tabOn]} onPress={() => { if (k !== tab) { tap(); setTab(k); } }}>
            <Text style={[st.tabText, tab === k && st.tabTextOn]}>{label}{k === 'timers' && timerCount ? `  ${timerCount}` : ''}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'timers' && <TimersTab patient={patient} />}
        {tab === 'hp' && <NoteEditor key="hp" patient={patient} mode="hp" />}
        {tab === 'soap' && <NoteEditor key="soap" patient={patient} mode="soap" />}
      </View>

      <Sheet visible={editing} onClose={() => setEditing(false)} title="Patient details"
        footer={<><Btn label="Cancel" kind="secondary" onPress={() => setEditing(false)} /><Btn label="Save" onPress={save} disabled={!initials.trim()} flex={2} /></>}>
        <PatientDetailsFields {...{ initials, setInitials, age, setAge, sex, setSex, desc, setDesc }} onSubmit={save} />
      </Sheet>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md, marginBottom: S.md },
  iconBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  who:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...T.caption, color: C.ink, fontWeight: '700', letterSpacing: 0.5 },
  tabs:   { flexDirection: 'row', marginHorizontal: S.lg, backgroundColor: C.sunken, borderRadius: R.md, padding: 3, marginBottom: S.sm },
  tab:    { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  tabOn:  { backgroundColor: C.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  tabText:{ ...T.bodyM, fontSize: 14, color: C.ink3 },
  tabTextOn: { color: C.ink, fontWeight: '600' },
  input:  { ...T.body, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md + 2, paddingVertical: 13 },
  initials: { flex: 1, fontSize: 20, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  sexSeg: { flexDirection: 'row', backgroundColor: C.sunken, borderRadius: R.md, padding: 3 },
  sexBtn: { width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  sexOn:  { backgroundColor: C.surface },
  note:   { ...T.caption, color: C.ink4, marginTop: 2 },
});
