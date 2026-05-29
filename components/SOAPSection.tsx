/**
 * SOAP note tab.
 * Shares vitals, labs, PE, and A/P with the H&P tab —
 * all stored in the same hp object on the patient.
 */
import { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { HAndP, Labs, Vitals } from '../data/patients';
import { CBCFishbone, BMPFishbone } from './LabFishbone';

const BORDER = '#D8D8D8';
const BG = '#fff';

const LAB_ORDER: (keyof Labs)[] = [
  'wbc', 'hgb', 'hct', 'plt',
  'na', 'k', 'cl', 'co2', 'bun', 'cr', 'glu',
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

function vColor(val: string, lo: number, hi: number) {
  const n = parseFloat(val);
  if (!val || isNaN(n)) return '#1C1C1E';
  return n > hi ? '#E24B4A' : n < lo ? '#2471A3' : '#1C1C1E';
}

type VCProps = {
  label: string; value: string; onChange: (v: string) => void;
  inputRef: (r: TextInput | null) => void;
  onNext: () => void; isLast: boolean;
  lo: number; hi: number;
};
function VitCell({ label, value, onChange, inputRef, onNext, isLast, lo, hi }: VCProps) {
  return (
    <View style={s.vitCell}>
      <Text style={s.vitLabel}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={[s.vitInput, { color: vColor(value, lo, hi) }]}
        value={value} onChangeText={onChange}
        keyboardType="decimal-pad"
        returnKeyType={isLast ? 'done' : 'next'}
        onSubmitEditing={isLast ? undefined : onNext}
        placeholder="—" placeholderTextColor="#CCC"
        textAlign="center" maxLength={5}
      />
    </View>
  );
}

type Props = { hp: HAndP; onUpdate: (hp: HAndP) => void };

export default function SOAPSection({ hp, onUpdate }: Props) {
  const [local, setLocal] = useState<HAndP>(hp);
  const labRefs = useRef<Partial<Record<keyof Labs, TextInput | null>>>({});
  const vitRefs = useRef<Partial<Record<VitKey, TextInput | null>>>({});

  function patch(u: Partial<HAndP>) {
    const next = { ...local, ...u };
    setLocal(next);
    onUpdate(next);
  }
  function pV(v: Partial<Vitals>) { patch({ vitals: { ...local.vitals, ...v } }); }
  function pL(k: keyof Labs, v: string) { patch({ labs: { ...local.labs, [k]: v } }); }
  function advLab(cur: keyof Labs) {
    const next = LAB_ORDER[LAB_ORDER.indexOf(cur) + 1];
    if (next) labRefs.current[next]?.focus();
  }
  function advVit(cur: VitKey) {
    const next = VIT_ORDER[VIT_ORDER.indexOf(cur) + 1];
    if (next) vitRefs.current[next]?.focus();
  }

  const vit  = local.vitals ?? {};
  const labs = local.labs   ?? {};

  return (
    <ScrollView
      style={s.scroll} contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
    >
      {/* ── S — Subjective ──────────────── */}
      <View style={s.soapHeader}>
        <Text style={s.soapLetter}>S</Text>
        <Text style={s.soapWord}>Subjective</Text>
      </View>
      <TextInput style={s.note}
        value={local.subjective ?? ''} onChangeText={v => patch({ subjective: v })}
        multiline placeholder="Chief complaint, history…" placeholderTextColor="#CCC" />

      {/* ── O — Objective ───────────────── */}
      <View style={[s.soapHeader, { marginTop: 24 }]}>
        <Text style={s.soapLetter}>O</Text>
        <Text style={s.soapWord}>Objective</Text>
      </View>

      <Text style={s.secTitle}>Physical Exam</Text>
      <TextInput style={s.note}
        value={local.pe ?? ''} onChangeText={v => patch({ pe: v })}
        multiline placeholder="Exam findings…" placeholderTextColor="#CCC" />

      <Text style={s.secTitle}>Vitals</Text>
      <View style={s.vitRow}>
        <VitCell label="Temp °C" value={vit.temp ?? ''} onChange={v => pV({ temp: v })}
          inputRef={r => { vitRefs.current.temp = r; }} onNext={() => advVit('temp')} isLast={false}
          lo={VIT_RANGES.temp[0]} hi={VIT_RANGES.temp[1]} />
        <VitCell label="RR" value={vit.rr ?? ''} onChange={v => pV({ rr: v })}
          inputRef={r => { vitRefs.current.rr = r; }} onNext={() => advVit('rr')} isLast={false}
          lo={VIT_RANGES.rr[0]} hi={VIT_RANGES.rr[1]} />
        <VitCell label="HR" value={vit.hr ?? ''} onChange={v => pV({ hr: v })}
          inputRef={r => { vitRefs.current.hr = r; }} onNext={() => advVit('hr')} isLast={false}
          lo={VIT_RANGES.hr[0]} hi={VIT_RANGES.hr[1]} />
        <View style={[s.vitCell, { flex: 2 }]}>
          <Text style={s.vitLabel}>BP</Text>
          <View style={s.bpRow}>
            <TextInput
              ref={r => { vitRefs.current.bpS = r; }}
              style={[s.vitInput, { flex: 1, color: vColor(vit.bpS ?? '', 90, 120) }]}
              value={vit.bpS ?? ''} onChangeText={v => pV({ bpS: v })}
              keyboardType="number-pad" returnKeyType="next"
              onSubmitEditing={() => advVit('bpS')}
              placeholder="sys" placeholderTextColor="#CCC" textAlign="center" maxLength={4} />
            <Text style={s.bpSlash}>/</Text>
            <TextInput
              ref={r => { vitRefs.current.bpD = r; }}
              style={[s.vitInput, { flex: 1, color: vColor(vit.bpD ?? '', 60, 80) }]}
              value={vit.bpD ?? ''} onChangeText={v => pV({ bpD: v })}
              keyboardType="number-pad" returnKeyType="done"
              placeholder="dia" placeholderTextColor="#CCC" textAlign="center" maxLength={3} />
          </View>
        </View>
      </View>

      {/* O₂ row */}
      <View style={s.o2Row}>
        <Text style={s.vitLabel}>O₂</Text>
        {(['RA', 'NC', 'BiPAP'] as const).map(mode => (
          <TouchableOpacity key={mode}
            style={[s.o2Pill, vit.o2Mode === mode && s.o2Active]}
            onPress={() => pV({ o2Mode: mode, o2Val: mode === 'RA' ? undefined : vit.o2Val })}>
            <Text style={[s.o2Text, vit.o2Mode === mode && s.o2TextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
        {vit.o2Mode && vit.o2Mode !== 'RA' && (
          <TextInput style={s.o2Input}
            value={vit.o2Val ?? ''} onChangeText={v => pV({ o2Val: v })}
            keyboardType="decimal-pad" returnKeyType="done"
            placeholder={vit.o2Mode === 'NC' ? 'L/min' : 'IPAP/EPAP'}
            placeholderTextColor="#CCC" textAlign="center" maxLength={5} />
        )}
      </View>

      <Text style={s.secTitle}>Labs</Text>
      <Text style={s.fishTitle}>CBC</Text>
      <CBCFishbone labs={labs} labRefs={labRefs} patchLab={pL} advance={advLab} />
      <Text style={[s.fishTitle, { marginTop: 14 }]}>BMP / Chem</Text>
      <BMPFishbone labs={labs} labRefs={labRefs} patchLab={pL} advance={advLab} />

      {/* ── A/P ─────────────────────────── */}
      <View style={[s.soapHeader, { marginTop: 24 }]}>
        <Text style={s.soapLetter}>A</Text>
        <Text style={s.soapWord}>Assessment / Plan</Text>
      </View>
      <TextInput style={[s.note, { minHeight: 120 }]}
        value={local.ap ?? ''} onChangeText={v => patch({ ap: v })}
        multiline placeholder="Assessment and plan…" placeholderTextColor="#CCC" />

    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },

  soapHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  soapLetter: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  soapWord:   { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },

  secTitle:   { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  fishTitle:  { fontSize: 11, fontWeight: '600', color: '#BBB', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  note: {
    backgroundColor: BG, borderRadius: 12,
    borderWidth: 0.5, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1C1C1E',
    minHeight: 80, textAlignVertical: 'top',
  },

  vitRow:  { flexDirection: 'row', gap: 8 },
  vitCell: { flex: 1, alignItems: 'center' },
  vitLabel:{ fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  vitInput:{ backgroundColor: BG, borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 10, fontSize: 15, width: '100%' },
  bpRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, width: '100%' },
  bpSlash: { fontSize: 18, color: '#BBB', fontWeight: '300' },

  o2Row:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  o2Pill:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  o2Active:    { backgroundColor: '#1C1C1E' },
  o2Text:      { fontSize: 13, fontWeight: '500', color: '#555' },
  o2TextActive:{ color: '#fff' },
  o2Input:     { flex: 1, backgroundColor: BG, borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 8, fontSize: 15, color: '#1C1C1E' },
});
