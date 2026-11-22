/**
 * SOAP note tab.
 * Shares vitals, labs, PE, and A/P with the H&P tab —
 * all stored in the same hp object on the patient.
 */
import { useRef, useState } from 'react';
import { useNoteToolbar } from '../hooks/useNoteToolbar';
import { useScrollToCenter } from '../hooks/useScrollToCenter';
import APInput from './APInput';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { HAndP, Labs, Vitals } from '../data/patients';
import { EXAM_SECTIONS } from '../data/examSections';
import { ROS_SECTIONS } from '../data/rosSections';
import { CBCFishbone, BMPFishbone, LFTFishbone } from './LabFishbone';
import DiagnosticsInput from './DiagnosticsInput';

const BORDER = '#D8D8D8';
const BG = '#fff';

const LAB_ORDER: (keyof Labs)[] = [
  'wbc', 'hgb', 'hct', 'plt',
  'na', 'k', 'cl', 'co2', 'bun', 'cr', 'glu',
  'ca', 'po4', 'tp', 'alb', 'ast', 'alt', 'ldh', 'ap', 'bili',
];
const VIT_ORDER = ['temp', 'rr', 'hr', 'bpS', 'bpD'] as const;
type VitKey = typeof VIT_ORDER[number];

const VIT_RANGES: Record<VitKey, [number, number]> = {
  temp: [36.0, 37.5],
  rr:   [12,   20],
  hr:   [60,   100],
  bpS:  [90,   120],
  bpD:  [60,   80],
};

function prevVitColor(val: string, lo: number, hi: number): string {
  const n = parseFloat(val);
  if (!val || isNaN(n)) return '#AAAAAA';
  if (n > hi) return '#D97F7E';
  if (n < lo) return '#7AAEC8';
  return '#AAAAAA';
}

function vColor(val: string, lo: number, hi: number) {
  const n = parseFloat(val);
  if (!val || isNaN(n)) return '#1C1C1E';
  return n > hi ? '#E24B4A' : n < lo ? '#2471A3' : '#1C1C1E';
}

type VCProps = {
  label: string; value: string; prevValue?: string; onChange: (v: string) => void;
  inputRef: (r: TextInput | null) => void;
  onNext: () => void; isLast: boolean;
  lo: number; hi: number;
  maxLen?: number;
};
function VitCell({ label, value, prevValue, onChange, inputRef, onNext, isLast, lo, hi, maxLen }: VCProps) {
  return (
    <View style={s.vitCell}>
      {!!prevValue && (
        <Text style={[s.vitPrev, { color: prevVitColor(prevValue, lo, hi) }]}>{prevValue}</Text>
      )}
      <Text style={s.vitLabel} numberOfLines={1}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={[s.vitInput, { color: vColor(value, lo, hi) }]}
        value={value}
        onChangeText={t => { if (/^\d*\.?\d?$/.test(t)) onChange(t); }}
        keyboardType="decimal-pad"
        returnKeyType={isLast ? 'done' : 'next'}
        onSubmitEditing={isLast ? undefined : onNext}
        placeholder="—" placeholderTextColor="#CCC"
        textAlign="center"
        selectTextOnFocus
        blurOnSubmit={isLast}
        maxLength={maxLen}
      />
    </View>
  );
}

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = { patientId: string; hp: HAndP; onUpdate: (hp: HAndP) => void };

// ── ROS display card ──────────────────────────────────────────
function ROSCard({ rosFindings, rosNote, onRosNoteChange, onPress }: {
  rosFindings: Record<string, 'pos' | 'neg'>;
  rosNote: string;
  onRosNoteChange: (v: string) => void;
  onPress: () => void;
}) {
  const posItems: string[] = [];
  const negItems: string[] = [];
  ROS_SECTIONS.forEach(sec =>
    sec.findings.forEach(f => {
      const state = rosFindings[`${sec.key}_${f.key}`];
      if (state === 'pos') posItems.push(f.pos);
      if (state === 'neg') negItems.push(f.neg);
    })
  );
  const hasFindings = posItems.length > 0 || negItems.length > 0;

  return (
    <View style={s.examCard}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {hasFindings ? (
          <>
            <View style={s.examChips}>
              {posItems.map((t, i) => (
                <View key={`p${i}`} style={s.examChipPos}><Text style={s.examChipPosText}>{t}</Text></View>
              ))}
              {negItems.map((t, i) => (
                <View key={`n${i}`} style={s.examChipNeg}><Text style={s.examChipNegText}>{t}</Text></View>
              ))}
            </View>
            <Text style={s.examEditHint}>Tap to edit →</Text>
          </>
        ) : (
          <Text style={s.examPlaceholder}>Tap to document review of systems →</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={s.examExtraInput}
        placeholder="Additional ROS notes…"
        placeholderTextColor="#CCC"
        value={rosNote}
        onChangeText={onRosNoteChange}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

// ── Shared exam display card (same logic as HAndPSection) ─────
// Flat chip row — all findings in one line, pos (dark) then neg (green).
function ExamCard({ examFindings, peNote, onPeNoteChange, onPress }: {
  examFindings: Record<string, 'pos' | 'neg'>;
  peNote: string;
  onPeNoteChange: (v: string) => void;
  onPress: () => void;
}) {
  const posItems: string[] = [];
  const negItems: string[] = [];
  EXAM_SECTIONS.forEach(sec =>
    sec.findings.forEach(f => {
      const state = examFindings[`${sec.key}_${f.key}`];
      if (state === 'pos') posItems.push(f.pos);
      if (state === 'neg') negItems.push(f.neg);
    })
  );
  const hasFindings = posItems.length > 0 || negItems.length > 0;

  return (
    <View style={s.examCard}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {hasFindings ? (
          <>
            <View style={s.examChips}>
              {posItems.map((t, i) => (
                <View key={`p${i}`} style={s.examChipPos}><Text style={s.examChipPosText}>{t}</Text></View>
              ))}
              {negItems.map((t, i) => (
                <View key={`n${i}`} style={s.examChipNeg}><Text style={s.examChipNegText}>{t}</Text></View>
              ))}
            </View>
            <Text style={s.examEditHint}>Tap to edit →</Text>
          </>
        ) : (
          <Text style={s.examPlaceholder}>Tap to document physical exam →</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={s.examExtraInput}
        placeholder="Additional exam notes…"
        placeholderTextColor="#CCC"
        value={peNote}
        onChangeText={onPeNoteChange}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

export default function SOAPSection({ patientId, hp, onUpdate }: Props) {
  const navigation = useNavigation<Nav>();
  const [local, setLocal] = useState<HAndP>(hp);
  const labRefs       = useRef<Partial<Record<keyof Labs, TextInput | null>>>({});
  const vitRefs       = useRef<Partial<Record<VitKey, TextInput | null>>>({});
  const subjectiveRef = useRef<TextInput>(null);
  const apRef         = useRef<View>(null);
  const { scrollRef, scrollProps, centerInput } = useScrollToCenter();

  function patch(u: Partial<HAndP>) {
    // Always pull builder-owned fields from the hp prop — ExamBuilder and
    // ROSBuilder write directly to context; local state never sees those updates.
    const next = {
      ...local,
      examFindings: hp.examFindings,
      examNotes:    hp.examNotes,
      rosFindings:  hp.rosFindings,
      ...u,
    };
    setLocal(next);
    onUpdate(next);
  }
  function pV(v: Partial<Vitals>) { patch({ vitals: { ...local.vitals, ...v } }); }
  function pL(k: keyof Labs, v: string) { patch({ labs: { ...local.labs, [k]: v } }); }

  const CBC_KEYS: (keyof Labs)[] = ['wbc', 'hgb', 'hct', 'plt'];
  const BMP_KEYS: (keyof Labs)[] = ['na', 'k', 'cl', 'co2', 'bun', 'cr', 'glu'];
  const LFT_KEYS: (keyof Labs)[] = ['ca', 'po4', 'tp', 'alb', 'ast', 'alt', 'ldh', 'ap', 'bili'];

  function advanceCBC() {
    const prevLabs = { ...local.prevLabs };
    const labs = { ...local.labs };
    CBC_KEYS.forEach(k => { if (labs[k]) prevLabs[k] = labs[k]; labs[k] = undefined; });
    patch({ labs, prevLabs });
  }

  function advanceBMP() {
    const prevLabs = { ...local.prevLabs };
    const labs = { ...local.labs };
    BMP_KEYS.forEach(k => { if (labs[k]) prevLabs[k] = labs[k]; labs[k] = undefined; });
    patch({ labs, prevLabs });
  }

  function advanceLFT() {
    const prevLabs = { ...local.prevLabs };
    const labs = { ...local.labs };
    LFT_KEYS.forEach(k => { if (labs[k]) prevLabs[k] = labs[k]; labs[k] = undefined; });
    patch({ labs, prevLabs });
  }

  function advanceVitals() {
    patch({ prevVitals: { ...local.vitals }, vitals: {} });
  }

  // Keyboard toolbar for note fields
  const subjectiveTb = useNoteToolbar(local.subjective ?? '', v => patch({ subjective: v }));

  function advLab(cur: keyof Labs) {
    const next = LAB_ORDER[LAB_ORDER.indexOf(cur) + 1];
    if (next) labRefs.current[next]?.focus();
  }
  function advVit(cur: VitKey) {
    const next = VIT_ORDER[VIT_ORDER.indexOf(cur) + 1];
    if (next) vitRefs.current[next]?.focus();
  }

  const vit      = local.vitals     ?? {};
  const prevVit  = local.prevVitals ?? {};
  const labs     = local.labs       ?? {};
  const prevLabs = local.prevLabs   ?? {};

  return (
    <ScrollView
      ref={scrollRef}
      style={s.scroll} contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
      {...scrollProps}
    >
      {/* ── S — Subjective ──────────────── */}
      <View style={s.soapHeader}>
        <Text style={s.soapLetter}>S</Text>
        <Text style={s.soapWord}>Subjective</Text>
      </View>
      <TextInput
        ref={subjectiveRef}
        style={s.note}
        value={local.subjective ?? ''} onChangeText={v => patch({ subjective: v })}
        multiline placeholder="Chief complaint, history…" placeholderTextColor="#CCC"
        {...subjectiveTb}
        onFocus={() => { subjectiveTb.onFocus(); centerInput(subjectiveRef.current); }}
      />

      {/* ── ROS (under Subjective) ──────── */}
      <Text style={s.secTitle}>Review of Systems</Text>
      <ROSCard
        rosFindings={hp.rosFindings ?? {}}
        rosNote={local.rosNote ?? ''}
        onRosNoteChange={v => patch({ rosNote: v })}
        onPress={() => navigation.navigate('ROSBuilder', { patientId })}
      />

      {/* ── O — Objective ───────────────── */}
      <View style={[s.soapHeader, { marginTop: 24 }]}>
        <Text style={s.soapLetter}>O</Text>
        <Text style={s.soapWord}>Objective</Text>
      </View>

      <Text style={s.secTitle}>Physical Exam</Text>
      <ExamCard
        examFindings={hp.examFindings ?? {}}
        peNote={local.peNote ?? ''}
        onPeNoteChange={v => patch({ peNote: v })}
        onPress={() => navigation.navigate('ExamBuilder', { patientId })}
      />

      <View style={s.vitSectionHeader}>
        <Text style={[s.secTitle, { marginTop: 0, marginBottom: 0 }]}>Vitals</Text>
        <TouchableOpacity onPress={advanceVitals} style={s.advBtn}>
          <Text style={s.advBtnText}>Adv →</Text>
        </TouchableOpacity>
      </View>
      <View style={s.vitRow}>
        <VitCell label="T °C"
          value={vit.temp ?? ''} prevValue={prevVit.temp}
          onChange={v => pV({ temp: v })}
          inputRef={r => { vitRefs.current.temp = r; }} onNext={() => advVit('temp')} isLast={false}
          lo={VIT_RANGES.temp[0]} hi={VIT_RANGES.temp[1]} maxLen={4} />
        <VitCell label="RR" value={vit.rr ?? ''} prevValue={prevVit.rr} onChange={v => pV({ rr: v })}
          inputRef={r => { vitRefs.current.rr = r; }} onNext={() => advVit('rr')} isLast={false}
          lo={VIT_RANGES.rr[0]} hi={VIT_RANGES.rr[1]} maxLen={2} />
        <VitCell label="HR" value={vit.hr ?? ''} prevValue={prevVit.hr} onChange={v => pV({ hr: v })}
          inputRef={r => { vitRefs.current.hr = r; }} onNext={() => advVit('hr')} isLast={false}
          lo={VIT_RANGES.hr[0]} hi={VIT_RANGES.hr[1]} maxLen={3} />
        <View style={[s.vitCell, { flex: 2 }]}>
          {(!!prevVit.bpS || !!prevVit.bpD) && (
            <Text style={s.vitPrev}>
              <Text style={{ color: prevVitColor(prevVit.bpS ?? '', 90, 120) }}>{prevVit.bpS ?? '—'}</Text>
              <Text style={{ color: '#AAAAAA' }}>/</Text>
              <Text style={{ color: prevVitColor(prevVit.bpD ?? '', 60, 80) }}>{prevVit.bpD ?? '—'}</Text>
            </Text>
          )}
          <Text style={s.vitLabel}>BP</Text>
          <View style={s.bpRow}>
            <TextInput
              ref={r => { vitRefs.current.bpS = r; }}
              style={[s.vitInput, { flex: 1, color: vColor(vit.bpS ?? '', 90, 120) }]}
              value={vit.bpS ?? ''}
              onChangeText={v => pV({ bpS: v })}
              keyboardType="number-pad" returnKeyType="next"
              onSubmitEditing={() => advVit('bpS')}
              placeholder="sys" placeholderTextColor="#CCC" textAlign="center" maxLength={3} />
            <Text style={s.bpSlash}>/</Text>
            <TextInput
              ref={r => { vitRefs.current.bpD = r; }}
              style={[s.vitInput, { flex: 1, color: vColor(vit.bpD ?? '', 60, 80) }]}
              value={vit.bpD ?? ''}
              onChangeText={v => pV({ bpD: v })}
              keyboardType="number-pad" returnKeyType="done"
              placeholder="dia" placeholderTextColor="#CCC" textAlign="center" maxLength={2} />
          </View>
        </View>
        {/* O₂ */}
        <View style={[s.vitCell, { flex: 2 }]}>
          {!!prevVit.o2Mode && (
            <Text style={s.vitPrev}>
              {prevVit.o2Mode}{prevVit.o2Val ? ` ${prevVit.o2Val}` : ''}
            </Text>
          )}
          <Text style={s.vitLabel} numberOfLines={1}>O₂</Text>
          <View style={s.o2Row}>
            <View style={s.o2PillsCol}>
              {(['RA', 'NC', 'BiPAP'] as const).map(mode => (
                <TouchableOpacity key={mode}
                  style={[s.o2Pill, vit.o2Mode === mode && s.o2Active]}
                  onPress={() => pV({ o2Mode: mode, o2Val: mode === 'RA' ? undefined : vit.o2Val })}>
                  <Text style={[s.o2Text, vit.o2Mode === mode && s.o2TextActive]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {vit.o2Mode && vit.o2Mode !== 'RA' && (
              <TextInput style={s.o2ValInput}
                value={vit.o2Val ?? ''} onChangeText={v => { if (/^\d*\.?\d?$/.test(v)) pV({ o2Val: v }); }}
                keyboardType="decimal-pad" returnKeyType="done"
                placeholder={vit.o2Mode === 'NC' ? 'L/m' : 'IP/EP'}
                placeholderTextColor="#CCC" textAlign="center" maxLength={5} />
            )}
          </View>
        </View>
      </View>

      <Text style={s.secTitle}>Labs</Text>

      <View style={s.fishHeader}>
        <Text style={s.fishTitle}>CBC</Text>
        <TouchableOpacity onPress={advanceCBC} style={s.advBtn}>
          <Text style={s.advBtnText}>Adv →</Text>
        </TouchableOpacity>
      </View>
      <CBCFishbone labs={labs} prevLabs={prevLabs} labRefs={labRefs} patchLab={pL} advance={advLab} />

      <View style={[s.fishHeader, { marginTop: 10 }]}>
        <Text style={s.fishTitle}>BMP</Text>
        <TouchableOpacity onPress={advanceBMP} style={s.advBtn}>
          <Text style={s.advBtnText}>Adv →</Text>
        </TouchableOpacity>
      </View>
      <BMPFishbone labs={labs} prevLabs={prevLabs} labRefs={labRefs} patchLab={pL} advance={advLab} />

      <View style={s.fishHeader}>
        <Text style={s.fishTitle}>LFT / CMP</Text>
        <TouchableOpacity onPress={advanceLFT} style={s.advBtn}>
          <Text style={s.advBtnText}>Adv →</Text>
        </TouchableOpacity>
      </View>
      <LFTFishbone labs={labs} prevLabs={prevLabs} labRefs={labRefs} patchLab={pL} advance={advLab} />

      <Text style={s.secTitle}>Imaging</Text>
      <DiagnosticsInput
        studies={local.imagingStudies ?? []}
        onChange={studies => patch({ imagingStudies: studies })}
      />

      {/* ── A/P ─────────────────────────── */}
      <View style={[s.soapHeader, { marginTop: 24 }]}>
        <Text style={s.soapLetter}>A</Text>
        <Text style={s.soapWord}>Assessment / Plan</Text>
      </View>
      <View ref={apRef}>
        <APInput
          value={local.ap ?? ''}
          onChange={v => patch({ ap: v })}
          hp={local}
          placeholder="Assessment and plan…"
          onFocused={() => centerInput(apRef.current)}
        />
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 110 },

  soapHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  soapLetter: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  soapWord:   { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },

  secTitle:   { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  labsRow:    { flexDirection: 'row', gap: 8 },
  labsCol:    { flex: 1 },
  fishHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fishTitle:  { fontSize: 11, fontWeight: '600', color: '#BBB', textTransform: 'uppercase', letterSpacing: 0.5 },
  advBtn:     { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  advBtnText: { fontSize: 11, fontWeight: '600', color: '#666' },

  note: {
    backgroundColor: BG, borderRadius: 12,
    borderWidth: 0.5, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1C1C1E',
    minHeight: 80, textAlignVertical: 'top',
  },

  vitSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  vitRow:  { flexDirection: 'row', gap: 8 },
  vitCell: { flex: 1, alignItems: 'center' },
  vitPrev: { fontSize: 11, fontStyle: 'italic', color: '#AAAAAA', marginBottom: 2, fontVariant: ['tabular-nums'] },
  vitLabel:{ fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  vitInput:{ backgroundColor: BG, borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 10, fontSize: 15, width: '100%' },
  bpRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, width: '100%' },
  bpSlash: { fontSize: 18, color: '#BBB', fontWeight: '300' },

  o2Row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  o2PillsCol:  { flexDirection: 'column', gap: 2, alignItems: 'flex-start' },
  o2Pill:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: '#F0F0F0' },
  o2Active:    { backgroundColor: '#1C1C1E' },
  o2Text:      { fontSize: 10, fontWeight: '500', color: '#555' },
  o2TextActive:{ color: '#fff' },
  o2ValInput:  { backgroundColor: BG, borderRadius: 8, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 6, fontSize: 12, color: '#1C1C1E', width: 40, textAlign: 'center' },
  // Exam display card
  examCard:        { backgroundColor: BG, borderRadius: 12, borderWidth: 0.5, borderColor: BORDER, padding: 14 },
  examChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  examChipPos:     { backgroundColor: '#FFEBEE', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#EF9A9A' },
  examChipPosText: { fontSize: 12, fontWeight: '500', color: '#C62828' },
  examChipNeg:     { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#A5D6A7' },
  examChipNegText: { fontSize: 12, fontWeight: '500', color: '#2E7D32' },
  examPlaceholder: { fontSize: 14, color: '#CCC', textAlign: 'center', paddingVertical: 6 },
  examEditHint:    { fontSize: 11, color: '#BBB', textAlign: 'right', marginTop: 8 },
  examExtraInput:  { marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#EBEBEB', paddingTop: 8, fontSize: 13, color: '#1C1C1E', minHeight: 36 },
});
