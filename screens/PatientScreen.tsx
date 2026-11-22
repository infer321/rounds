import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { ageSex } from '../utils/clinical';
import TimersTab from '../components/TimersTab';
import NoteEditor from '../components/NoteEditor';
import PatientForm, { usePatientDraft } from '../components/PatientForm';
import Sheet, { Btn } from '../components/Sheet';
import { Screen, ScreenHeader, Segmented } from '../components/ui';
import { C, T, S } from '../theme';

type Tab = 'timers' | 'hp' | 'soap';

export default function PatientScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Patient'>>();
  const { patients, editPatient } = usePatients();
  const patient = patients.find(p => p.id === params.patientId);
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
  const tabs = [['timers', n ? `Timers  ${n}` : 'Timers'], ['hp', 'H&P'], ['soap', 'SOAP']] as const;

  return (
    <Screen>
      <ScreenHeader
        title={[ageSex(patient.age, patient.gender), patient.descriptor].filter(Boolean).join(' · ') || 'Add details'}
        subtitle="Tap to edit"
        leading={<View style={st.avatar}><Text style={st.avatarText}>{patient.initials}</Text></View>}
        onTitlePress={() => { form.reset(patient); setEditing(true); }}
      />
      <Segmented options={tabs} value={tab} onChange={v => v && setTab(v)} style={st.tabs} />

      <View style={{ flex: 1 }}>
        {tab === 'timers' && <TimersTab patient={patient} />}
        {tab === 'hp' && <NoteEditor key="hp" patient={patient} mode="hp" />}
        {tab === 'soap' && <NoteEditor key="soap" patient={patient} mode="soap" />}
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
});
