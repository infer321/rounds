/**
 * NoteEditor: one component for both the H&P and SOAP tabs.
 * (Replaces two ~490-line near-copies.) Reads straight from context and
 * writes through patchHP, so builders, Complete round and typing can't
 * overwrite each other with a stale local copy.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Patient, PanelKey, Vitals } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useToast } from '../context/ToastContext';
import { useScrollToCenter } from '../hooks/useScrollToCenter';
import { PANEL_LABEL, hasAny, vitalsHasData } from '../utils/clinical';
import { buildHP, buildSOAP, examLines, rosLines } from '../utils/noteExport';
import { success, thud } from '../utils/haptics';
import VitalsBlock from './note/VitalsBlock';
import FindingsCard from './note/FindingsCard';
import NoteField from './note/NoteField';
import LabsSection from './note/LabsSection';
import { Section, SmallBtn } from './note/Section';
import TrendsSheet from './note/TrendsSheet';
import DiagnosticsInput from './DiagnosticsInput';
import APSection from './note/APSection';
import DailySection from './note/DailySection';
import Icon from './Icon';
import { C, T, R, S } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Stable empties so memoized blocks don't re-render on every keystroke
const NO_VITALS: Vitals = {};

export default function NoteEditor({ patient, mode }: { patient: Patient; mode: 'hp' | 'soap' }) {
  const navigation = useNavigation<Nav>();
  const { patchHP, advancePanel, completeRound } = usePatients();
  const toast = useToast();
  const { scrollRef, scrollProps, centerInput } = useScrollToCenter();
  const [trends, setTrends] = useState(false);

  const pid = patient.id;
  const hp = patient.hp ?? {};
  const patch = (u: Parameters<typeof patchHP>[1]) => patchHP(pid, u);
  const pV = (v: Partial<Vitals>) => patch(h => ({ ...h, vitals: { ...h.vitals, ...v } }));
  const center = (n: TextInput | null) => centerInput(n);

  const anyToAdvance = vitalsHasData(hp.vitals) || hasAny(hp.labs);

  function advance(p: PanelKey) {
    thud();
    advancePanel(pid, p);
    toast({ message: `${PANEL_LABEL[p]} saved to trends. Ready for new values.` });
  }

  function complete() {
    if (!anyToAdvance) return;
    thud();
    completeRound(pid);
    toast({ message: 'Round saved. Vitals and labs cleared for the next round.' });
  }

  async function copyNote() {
    const text = mode === 'hp' ? buildHP(patient) : buildSOAP(patient);
    await Clipboard.setStringAsync(text);
    success();
    toast({ message: `${mode === 'hp' ? 'H&P' : 'SOAP note'} copied. Paste into Teams or the EMR.` });
  }


  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={st.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        {...scrollProps}
      >
        <View style={st.actions}>
          <Pressable onPress={copyNote} style={({ pressed }) => [st.primary, pressed && { opacity: 0.85 }]}>
            <Icon name="copy" size={16} color={C.onInk} strokeWidth={2} />
            <Text style={st.primaryText}>Copy {mode === 'hp' ? 'H&P' : 'SOAP'}</Text>
          </Pressable>
          <Pressable onPress={complete} disabled={!anyToAdvance}
            style={({ pressed }) => [st.secondary, pressed && { backgroundColor: C.sunken }, !anyToAdvance && { opacity: 0.4 }]}>
            <Icon name="check" size={16} strokeWidth={2} />
            <Text style={st.secondaryText}>Complete round</Text>
          </Pressable>
        </View>

        {mode === 'hp' ? (
          <Section title="HPI">
            <NoteField value={hp.hpi ?? ''} onCommit={v => patch({ hpi: v })} placeholder="History of present illness" onFocused={center} />
          </Section>
        ) : (
          <Section title="Subjective">
            <NoteField value={hp.subjective ?? ''} onCommit={v => patch({ subjective: v })} placeholder="Overnight events, how they feel today" onFocused={center} />
          </Section>
        )}

        <Section title="Review of systems">
          <FindingsCard
            lines={rosLines({ ...hp, rosNote: undefined })}
            emptyText="Tap to document ROS"
            onOpen={() => navigation.navigate('ROSBuilder', { patientId: pid })}
            note={hp.rosNote ?? ''} onNote={v => patch({ rosNote: v })} notePlaceholder="Other ROS"
          />
        </Section>

        {mode === 'hp' && (
          <Section title="ED / hospital course">
            <NoteField value={hp.course ?? ''} onCommit={v => patch({ course: v })} placeholder="ED and hospital course" onFocused={center} />
          </Section>
        )}

        <Section title="Vitals" action={<SmallBtn label="Advance" onPress={() => advance('vitals')} disabled={!vitalsHasData(hp.vitals)} />}>
          <VitalsBlock vitals={hp.vitals ?? NO_VITALS} prev={hp.prevVitals ?? NO_VITALS} onChange={pV} />
        </Section>

        <Section title="Physical exam">
          <FindingsCard
            lines={examLines({ ...hp, peNote: undefined })}
            emptyText="Tap to document exam"
            onOpen={() => navigation.navigate('ExamBuilder', { patientId: pid })}
            note={hp.peNote ?? ''} onNote={v => patch({ peNote: v })} notePlaceholder="Other exam findings"
          />
        </Section>

        <LabsSection patient={patient} onAdvance={advance} onTrends={() => setTrends(true)} onFocusField={center} />

        <Section title="Imaging">
          <DiagnosticsInput studies={hp.imagingStudies ?? []} onChange={studies => patch({ imagingStudies: studies })} />
        </Section>

        <DailySection patient={patient} />

        <APSection patient={patient} onCenter={centerInput} />
      </ScrollView>
      <TrendsSheet hp={hp} visible={trends} onClose={() => setTrends(false)} />
    </>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: S.lg, paddingBottom: 140, paddingTop: S.sm },
  actions: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  primary: { flex: 1, flexDirection: 'row', gap: S.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 12 },
  primaryText: { ...T.bodyM, color: C.onInk },
  secondary: { flex: 1, flexDirection: 'row', gap: S.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.lineStrong, borderRadius: R.md, paddingVertical: 12 },
  secondaryText: { ...T.bodyM },
});
