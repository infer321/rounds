import { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { HAndP, Labs, Vitals } from '../data/patients';
import { CBCFishbone, BMPFishbone } from './LabFishbone';

const BORDER = '#D8D8D8';
const BG = '#fff';

// Tab-order for auto-advance: CBC first, then BMP left-to-right top-to-bottom
const LAB_ORDER: (keyof Labs)[] = ['wbc', 'hgb', 'hct', 'plt', 'na', 'k', 'cl', 'co2', 'bun', 'cr', 'glu'];

type Props = { hp: HAndP; onUpdate: (hp: HAndP) => void };

// ─── Vital cell ───────────────────────────────────────────────
function VitCell({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={s.vitCell}>
      <Text style={s.vitLabel}>{label}</Text>
      <TextInput
        style={s.vitInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor="#CCC"
        textAlign="center"
      />
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function HAndPSection({ hp, onUpdate }: Props) {
  const [local, setLocal] = useState<HAndP>(hp);
  const labRefs = useRef<Partial<Record<keyof Labs, TextInput | null>>>({});

  function patch(u: Partial<HAndP>) {
    const next = { ...local, ...u };
    setLocal(next);
    onUpdate(next);
  }
  function pV(v: Partial<Vitals>) { patch({ vitals: { ...local.vitals, ...v } }); }
  function pL(key: keyof Labs, val: string) { patch({ labs: { ...local.labs, [key]: val } }); }
  function advance(cur: keyof Labs) {
    const next = LAB_ORDER[LAB_ORDER.indexOf(cur) + 1];
    if (next) labRefs.current[next]?.focus();
  }

  const vit = local.vitals ?? {};
  const labs = local.labs ?? {};

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── HPI ─────────────────────────── */}
      <Text style={s.secTitle}>HPI</Text>
      <TextInput style={s.note} value={local.hpi ?? ''} onChangeText={v => patch({ hpi: v })}
        multiline placeholder="History of present illness…" placeholderTextColor="#CCC" />

      {/* ── ED / Hosp Course ────────────── */}
      <Text style={s.secTitle}>ED / Hosp Course</Text>
      <TextInput style={s.note} value={local.course ?? ''} onChangeText={v => patch({ course: v })}
        multiline placeholder="Hospital / ED course…" placeholderTextColor="#CCC" />

      {/* ── Vitals ──────────────────────── */}
      <Text style={s.secTitle}>Vitals</Text>
      <View style={s.vitRow}>
        <VitCell label="Temp" value={vit.temp ?? ''} onChange={v => pV({ temp: v })} />
        <VitCell label="RR"   value={vit.rr   ?? ''} onChange={v => pV({ rr: v })} />
        <VitCell label="HR"   value={vit.hr   ?? ''} onChange={v => pV({ hr: v })} />
        {/* BP */}
        <View style={[s.vitCell, { flex: 2 }]}>
          <Text style={s.vitLabel}>BP</Text>
          <View style={s.bpRow}>
            <TextInput style={[s.vitInput, { flex: 1 }]}
              value={vit.bpS ?? ''} onChangeText={v => pV({ bpS: v })}
              keyboardType="number-pad" placeholder="sys" placeholderTextColor="#CCC" textAlign="center" />
            <Text style={s.bpSlash}>/</Text>
            <TextInput style={[s.vitInput, { flex: 1 }]}
              value={vit.bpD ?? ''} onChangeText={v => pV({ bpD: v })}
              keyboardType="number-pad" placeholder="dia" placeholderTextColor="#CCC" textAlign="center" />
          </View>
        </View>
      </View>

      {/* O₂ */}
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
            keyboardType="decimal-pad"
            placeholder={vit.o2Mode === 'NC' ? 'L/min' : 'IPAP/EPAP'}
            placeholderTextColor="#CCC" textAlign="center" />
        )}
      </View>

      {/* ── Physical Exam ───────────────── */}
      <Text style={s.secTitle}>Physical Exam</Text>
      <TextInput style={s.note} value={local.pe ?? ''} onChangeText={v => patch({ pe: v })}
        multiline placeholder="Exam findings…" placeholderTextColor="#CCC" />

      {/* ── Labs ────────────────────────── */}
      <Text style={s.secTitle}>Labs</Text>

      {/* CBC fishbone — WBC ><>< Plts with Hgb/HCT on bar */}
      <Text style={s.fishTitle}>CBC</Text>
      <CBCFishbone labs={labs} labRefs={labRefs} patchLab={pL} advance={advance} />

      {/* BMP fishbone — spine + two crossings + Glu fish-tail */}
      <Text style={[s.fishTitle, { marginTop: 14 }]}>BMP / Chem</Text>
      <BMPFishbone labs={labs} labRefs={labRefs} patchLab={pL} advance={advance} />

      {/* ── Diagnostics ─────────────────── */}
      <Text style={s.secTitle}>Diagnostics</Text>
      <TextInput style={s.note} value={local.diagnostics ?? ''} onChangeText={v => patch({ diagnostics: v })}
        multiline placeholder="Imaging, EKG, procedures…" placeholderTextColor="#CCC" />

      {/* ── A/P ─────────────────────────── */}
      <Text style={s.secTitle}>Assessment / Plan</Text>
      <TextInput style={[s.note, { minHeight: 120 }]} value={local.ap ?? ''} onChangeText={v => patch({ ap: v })}
        multiline placeholder="Assessment and plan…" placeholderTextColor="#CCC" />

    </ScrollView>
  );
}


// ─── Section styles ───────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },

  secTitle: {
    fontSize: 12, fontWeight: '600', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 20, marginBottom: 8,
  },
  fishTitle: {
    fontSize: 11, fontWeight: '600', color: '#BBB',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },

  note: {
    backgroundColor: BG, borderRadius: 12,
    borderWidth: 0.5, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1C1C1E',
    minHeight: 80, textAlignVertical: 'top',
  },

  // Vitals
  vitRow:  { flexDirection: 'row', gap: 8 },
  vitCell: { flex: 1, alignItems: 'center' },
  vitLabel:{ fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  vitInput:{ backgroundColor: BG, borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 10, fontSize: 15, color: '#1C1C1E', width: '100%' },
  bpRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, width: '100%' },
  bpSlash: { fontSize: 18, color: '#BBB', fontWeight: '300' },

  // O₂
  o2Row:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  o2Pill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  o2Active:   { backgroundColor: '#1C1C1E' },
  o2Text:     { fontSize: 13, fontWeight: '500', color: '#555' },
  o2TextActive:{ color: '#fff' },
  o2Input:    { flex: 1, backgroundColor: BG, borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 8, fontSize: 15, color: '#1C1C1E' },
});
