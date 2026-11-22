/**
 * NoteEditor: one component for both the H&P and SOAP tabs.
 * (Replaces two ~490-line near-copies.) Reads straight from context and
 * writes through patchHP, so builders, Complete round and typing can't
 * overwrite each other with a stale local copy.
 */
import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Patient, PanelKey, Labs, Vitals } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useToast } from '../context/ToastContext';
import { useScrollToCenter } from '../hooks/useScrollToCenter';
import { LAB_ORDER, LabKey, PANELS, PANEL_LABEL, hasAny, vitalsHasData } from '../utils/clinical';
import { buildHP, buildSOAP, examLines, rosLines } from '../utils/noteExport';
import { success, thud } from '../utils/haptics';
import { CBCFishbone, BMPFishbone, LFTFishbone, LabRow } from './LabFishbone';
import VitalsBlock from './note/VitalsBlock';
import FindingsCard from './note/FindingsCard';
import NoteField from './note/NoteField';
import TrendsSheet from './note/TrendsSheet';
import DiagnosticsInput from './DiagnosticsInput';
import APInput from './APInput';
import Icon from './Icon';
import { C, T, R, S } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={st.section}>
      <View style={st.secHead}>
        <Text style={T.label}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function SmallBtn({ label, onPress, icon, disabled }: { label: string; onPress: () => void; icon?: 'trend' | 'copy' | 'check'; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8}
      style={({ pressed }) => [st.smallBtn, pressed && { backgroundColor: C.sunken }, disabled && { opacity: 0.35 }]}>
      {icon && <Icon name={icon} size={14} color={C.ink2} strokeWidth={2} />}
      <Text style={st.smallBtnText}>{label}</Text>
    </Pressable>
  );
}

export default function NoteEditor({ patient, mode }: { patient: Patient; mode: 'hp' | 'soap' }) {
  const navigation = useNavigation<Nav>();
  const { patchHP, advancePanel, completeRound } = usePatients();
  const toast = useToast();
  const { scrollRef, scrollProps, centerInput } = useScrollToCenter();
  const labRefs = useRef<Partial<Record<LabKey, TextInput | null>>>({});
  const apRef = useRef<View>(null);
  const [trends, setTrends] = useState(false);

  const pid = patient.id;
  const hp = patient.hp ?? {};
  const labs = hp.labs ?? {};
  const prevLabs = hp.prevLabs ?? {};
  const patch = (u: Parameters<typeof patchHP>[1]) => patchHP(pid, u);
  const pL = (k: LabKey, v: string) => patch(h => ({ ...h, labs: { ...h.labs, [k]: v } as Labs }));
  const pV = (v: Partial<Vitals>) => patch(h => ({ ...h, vitals: { ...h.vitals, ...v } }));
  const nextLab = (k: LabKey) => labRefs.current[LAB_ORDER[LAB_ORDER.indexOf(k) + 1]]?.focus();
  const center = (n: TextInput | null) => centerInput(n);

  const panelHasData = (p: Exclude<PanelKey, 'vitals'>) => PANELS[p].some(k => labs[k]);
  const anyToAdvance = vitalsHasData(hp.vitals) || hasAny(labs);

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

  const fishProps = { labs, prevLabs, labRefs, patchLab: pL, advance: nextLab };
  const advBtn = (p: Exclude<PanelKey, 'vitals'>) => <SmallBtn label="Advance" onPress={() => advance(p)} disabled={!panelHasData(p)} />;

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
            <Icon name="copy" size={16} color="#fff" strokeWidth={2} />
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
          <VitalsBlock vitals={hp.vitals ?? {}} prev={hp.prevVitals ?? {}} onChange={pV} />
        </Section>

        <Section title="Physical exam">
          <FindingsCard
            lines={examLines({ ...hp, peNote: undefined })}
            emptyText="Tap to document exam"
            onOpen={() => navigation.navigate('ExamBuilder', { patientId: pid })}
            note={hp.peNote ?? ''} onNote={v => patch({ peNote: v })} notePlaceholder="Other exam findings"
          />
        </Section>

        <Section title="Labs" action={<SmallBtn label="Trends" icon="trend" onPress={() => setTrends(true)} />}>
          <View style={{ gap: S.lg }}>
            <View><View style={st.panelHead}><Text style={st.panelTitle}>CBC</Text>{advBtn('cbc')}</View><CBCFishbone {...fishProps} /></View>
            <View><View style={st.panelHead}><Text style={st.panelTitle}>BMP</Text>{advBtn('bmp')}</View><BMPFishbone {...fishProps} /></View>
            <View><View style={st.panelHead}><Text style={st.panelTitle}>CMP / LFT</Text>{advBtn('lft')}</View><LFTFishbone {...fishProps} /></View>
            <View><View style={st.panelHead}><Text style={st.panelTitle}>Mg / Coags</Text>{advBtn('coag')}</View><LabRow {...fishProps} keys={PANELS.coag} /></View>
            <View>
              <View style={st.panelHead}><Text style={st.panelTitle}>Other</Text></View>
              <NoteField value={hp.otherLabs ?? ''} onCommit={v => patch({ otherLabs: v })} placeholder="Lactate 2.1, trop <6, BNP 840, BCx NGTD…" minHeight={48} onFocused={center} />
            </View>
          </View>
        </Section>

        <Section title="Imaging">
          <DiagnosticsInput studies={hp.imagingStudies ?? []} onChange={studies => patch({ imagingStudies: studies })} />
        </Section>

        <Section title="Assessment & plan">
          <View ref={apRef}>
            <APInput
              value={hp.ap ?? ''}
              onChange={v => patch({ ap: v })}
              hp={hp}
              placeholder={'# Problem\n- plan'}
              onFocused={() => centerInput(apRef.current)}
            />
          </View>
        </Section>
      </ScrollView>
      <TrendsSheet hp={hp} visible={trends} onClose={() => setTrends(false)} />
    </>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: S.lg, paddingBottom: 140, paddingTop: S.sm },
  actions: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  primary: { flex: 1, flexDirection: 'row', gap: S.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 12 },
  primaryText: { ...T.bodyM, color: '#fff' },
  secondary: { flex: 1, flexDirection: 'row', gap: S.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.lineStrong, borderRadius: R.md, paddingVertical: 12 },
  secondaryText: { ...T.bodyM },
  section: { marginTop: S.xl },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm, minHeight: 24 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, minHeight: 24 },
  panelTitle: { ...T.caption, color: C.ink2 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, borderWidth: 0.5, borderColor: C.lineStrong, backgroundColor: C.surface },
  smallBtnText: { ...T.caption, color: C.ink2 },
});
