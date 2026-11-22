import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { ageSex } from '../utils/clinical';
import TimersTab from '../components/TimersTab';
import NoteEditor from '../components/NoteEditor';
import EyeTab from '../components/EyeTab';
import Icon from '../components/Icon';
import { tap } from '../utils/haptics';
import PatientForm, { usePatientDraft } from '../components/PatientForm';
import Sheet, { Btn } from '../components/Sheet';
import { Screen, ScreenHeader, Segmented } from '../components/ui';
import { C, T, S } from '../theme';

type Tab = 'timers' | 'hp' | 'soap' | 'eye';

export default function PatientScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Patient'>>();
  const { patients, editPatient } = usePatients();
  const idx = patients.findIndex(p => p.id === params.patientId);
  const patient = patients[idx];
  const [tab, setTab] = useState<Tab>(params.tab ?? 'timers');
  const [editing, setEditing] = useState(false);
  const form = usePatientDraft();

  if (!patient) return null;

  const save = () => {
    if (!form.valid) return;
    editPatient(patient.id, form.draft);
    setEditing(false);
  };
  const n = patient.items.length;
  const tabs = [['timers', n ? `Timers ${n}` : 'Timers'], ['hp', 'H&P'], ['soap', 'SOAP'], ['eye', 'Eye']] as const;
  // Step through the list without leaving the current tab
  const go = (d: number) => {
    const next = patients[idx + d];
    if (next) { tap(); navigation.setParams({ patientId: next.id }); }
  };

  return (
    <Screen>
      <ScreenHeader
        title={[ageSex(patient.age, patient.gender), patient.descriptor].filter(Boolean).join(' · ') || 'Add details'}
        subtitle="Tap to edit"
        leading={<View style={st.avatar}><Text style={st.avatarText}>{patient.initials}</Text></View>}
        onTitlePress={() => { form.reset(patient); setEditing(true); }}
        right={<View style={st.nav}>
          <Pressable onPress={() => navigation.navigate('Present', { patientId: patient.id })} hitSlop={8} style={st.navBtn} accessibilityLabel="Presenting view"><Icon name="present" size={20} /></Pressable>
          <Pressable onPress={() => go(-1)} disabled={idx === 0} hitSlop={8} style={[st.navBtn, idx === 0 && { opacity: 0.3 }]} accessibilityLabel="Previous patient"><Icon name="back" size={20} /></Pressable>
          <Pressable onPress={() => go(1)} disabled={idx === patients.length - 1} hitSlop={8} style={[st.navBtn, idx === patients.length - 1 && { opacity: 0.3 }]} accessibilityLabel="Next patient"><Icon name="chevron" size={20} /></Pressable>
        </View>}
      />
      <Segmented options={tabs} value={tab} onChange={v => v && setTab(v)} style={st.tabs} />

      <View style={{ flex: 1 }}>
        {tab === 'timers' && <TimersTab key={`t-${patient.id}`} patient={patient} />}
        {tab === 'hp' && <NoteEditor key={`hp-${patient.id}`} patient={patient} mode="hp" />}
        {tab === 'soap' && <NoteEditor key={`soap-${patient.id}`} patient={patient} mode="soap" />}
        {tab === 'eye' && <EyeTab key={`eye-${patient.id}`} patient={patient} />}
      </View>

      <Sheet visible={editing} onClose={() => setEditing(false)} title="Patient details"
        footer={<><Btn label="Cancel" kind="secondary" onPress={() => setEditing(false)} /><Btn label="Save" onPress={save} disabled={!form.valid} flex={2} /></>}>
        <PatientForm draft={form.draft} set={form.set} onSubmit={save} />
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...T.caption, color: C.ink, fontWeight: '700', letterSpacing: 0.5 },
  tabs:       { marginHorizontal: S.lg, marginBottom: S.sm },
  nav:        { flexDirection: 'row' },
  navBtn:     { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
});
