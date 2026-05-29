import { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { HAndP, Labs, Vitals } from '../data/patients';

const LAB_ORDER: (keyof Labs)[] = ['wbc', 'hgb', 'plt', 'na', 'k', 'cl', 'co2', 'bun', 'cr', 'glu'];

type Props = { hp: HAndP; onUpdate: (hp: HAndP) => void; };

// ── Lab cell ──────────────────────────────────────────────────
function LabCell({
  label, value, onChange, inputRef, onNext, isLast, borderRight, flex,
}: {
  label: string; value: string; onChange: (v: string) => void;
  inputRef: (r: TextInput | null) => void;
  onNext: () => void; isLast: boolean;
  borderRight?: boolean; flex?: number;
}) {
  return (
    <View style={[s.labCell, borderRight && s.borderRight, flex !== undefined && { flex }]}>
      <Text style={s.labLabel}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={s.labInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numbers-and-punctuation"
        returnKeyType={isLast ? 'done' : 'next'}
        onSubmitEditing={isLast ? undefined : onNext}
        placeholder="—"
        placeholderTextColor="#DDD"
        textAlign="center"
        selectTextOnFocus
      />
    </View>
  );
}

// ── Vital cell ────────────────────────────────────────────────
function VitCell({
  label, value, onChange, flex,
}: {
  label: string; value: string; onChange: (v: string) => void; flex?: number;
}) {
  return (
    <View style={[s.vitCell, flex !== undefined && { flex }]}>
      <Text style={s.vitLabel}>{label}</Text>
      <TextInput
        style={s.vitInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numbers-and-punctuation"
        placeholder="—"
        placeholderTextColor="#CCC"
        textAlign="center"
      />
    </View>
  );
}

// ── Main component ────────────────────────────────────────────
export default function HAndPSection({ hp, onUpdate }: Props) {
  const [local, setLocal] = useState<HAndP>(hp);
  const labRefs = useRef<Partial<Record<keyof Labs, TextInput | null>>>({});

  function patch(updates: Partial<HAndP>) {
    const next = { ...local, ...updates };
    setLocal(next);
    onUpdate(next);
  }

  function patchVitals(v: Partial<Vitals>) {
    patch({ vitals: { ...local.vitals, ...v } });
  }

  function patchLab(key: keyof Labs, val: string) {
    patch({ labs: { ...local.labs, [key]: val } });
  }

  function advanceLab(current: keyof Labs) {
    const idx = LAB_ORDER.indexOf(current);
    const next = LAB_ORDER[idx + 1];
    if (next) labRefs.current[next]?.focus();
  }

  const vit: Vitals = local.vitals ?? {};
  const labs: Labs = local.labs ?? {};

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── HPI ────────────────────────────── */}
      <Text style={s.sectionTitle}>HPI</Text>
      <TextInput style={s.note} value={local.hpi ?? ''} onChangeText={v => patch({ hpi: v })}
        multiline placeholder="History of present illness…" placeholderTextColor="#CCC" />

      {/* ── ED / Hosp Course ───────────────── */}
      <Text style={s.sectionTitle}>ED / Hosp Course</Text>
      <TextInput style={s.note} value={local.course ?? ''} onChangeText={v => patch({ course: v })}
        multiline placeholder="Hospital / ED course…" placeholderTextColor="#CCC" />

      {/* ── Vitals ─────────────────────────── */}
      <Text style={s.sectionTitle}>Vitals</Text>

      {/* Row: Temp RR HR BP */}
      <View style={s.vitRow}>
        <VitCell label="Temp" value={vit.temp ?? ''} onChange={v => patchVitals({ temp: v })} />
        <VitCell label="RR"   value={vit.rr ?? ''}   onChange={v => patchVitals({ rr: v })} />
        <VitCell label="HR"   value={vit.hr ?? ''}   onChange={v => patchVitals({ hr: v })} />
        {/* BP sys/dia */}
        <View style={[s.vitCell, { flex: 2 }]}>
          <Text style={s.vitLabel}>BP</Text>
          <View style={s.bpRow}>
            <TextInput
              style={[s.vitInput, { flex: 1 }]}
              value={vit.bpS ?? ''}
              onChangeText={v => patchVitals({ bpS: v })}
              keyboardType="number-pad"
              placeholder="sys"
              placeholderTextColor="#CCC"
              textAlign="center"
            />
            <Text style={s.bpSlash}>/</Text>
            <TextInput
              style={[s.vitInput, { flex: 1 }]}
              value={vit.bpD ?? ''}
              onChangeText={v => patchVitals({ bpD: v })}
              keyboardType="number-pad"
              placeholder="dia"
              placeholderTextColor="#CCC"
              textAlign="center"
            />
          </View>
        </View>
      </View>

      {/* O₂ row */}
      <View style={s.o2Row}>
        <Text style={s.vitLabel}>O₂</Text>
        {(['RA', 'NC', 'BiPAP'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[s.o2Pill, vit.o2Mode === mode && s.o2PillActive]}
            onPress={() => patchVitals({ o2Mode: mode, o2Val: mode === 'RA' ? undefined : vit.o2Val })}
          >
            <Text style={[s.o2PillText, vit.o2Mode === mode && s.o2PillTextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
        {vit.o2Mode && vit.o2Mode !== 'RA' && (
          <TextInput
            style={s.o2Input}
            value={vit.o2Val ?? ''}
            onChangeText={v => patchVitals({ o2Val: v })}
            keyboardType="numbers-and-punctuation"
            placeholder={vit.o2Mode === 'NC' ? 'L/min' : 'IPAP/EPAP'}
            placeholderTextColor="#CCC"
            textAlign="center"
          />
        )}
      </View>

      {/* ── Physical Exam ──────────────────── */}
      <Text style={s.sectionTitle}>Physical Exam</Text>
      <TextInput style={s.note} value={local.pe ?? ''} onChangeText={v => patch({ pe: v })}
        multiline placeholder="Exam findings…" placeholderTextColor="#CCC" />

      {/* ── Labs ───────────────────────────── */}
      <Text style={s.sectionTitle}>Labs</Text>

      {/* CBC fishbone */}
      <Text style={s.fishLabel}>CBC</Text>
      <View style={s.fishRowBox}>
        {/* Left col: WBC full height */}
        <View style={[{ flex: 1 }, s.borderRight]}>
          <LabCell label="WBC" value={labs.wbc ?? ''} onChange={v => patchLab('wbc', v)}
            inputRef={r => { labRefs.current.wbc = r; }} onNext={() => advanceLab('wbc')} isLast={false} />
        </View>
        {/* Right col: Hgb top / Plt bottom */}
        <View style={{ flex: 1 }}>
          <LabCell label="Hgb" value={labs.hgb ?? ''} onChange={v => patchLab('hgb', v)}
            inputRef={r => { labRefs.current.hgb = r; }} onNext={() => advanceLab('hgb')} isLast={false} />
          <View style={s.borderTop} />
          <LabCell label="Plt" value={labs.plt ?? ''} onChange={v => patchLab('plt', v)}
            inputRef={r => { labRefs.current.plt = r; }} onNext={() => advanceLab('plt')} isLast={false} />
        </View>
      </View>

      {/* BMP fishbone */}
      <Text style={[s.fishLabel, { marginTop: 12 }]}>BMP</Text>
      <View style={s.fishBox}>
        {/* Row 1: Na Cl BUN */}
        <View style={[s.fishBmpRow, s.borderBottom]}>
          <LabCell label="Na"  value={labs.na ?? ''}  onChange={v => patchLab('na', v)}
            inputRef={r => { labRefs.current.na = r; }} onNext={() => advanceLab('na')} isLast={false} borderRight flex={1} />
          <LabCell label="Cl"  value={labs.cl ?? ''}  onChange={v => patchLab('cl', v)}
            inputRef={r => { labRefs.current.cl = r; }} onNext={() => advanceLab('cl')} isLast={false} borderRight flex={1} />
          <LabCell label="BUN" value={labs.bun ?? ''} onChange={v => patchLab('bun', v)}
            inputRef={r => { labRefs.current.bun = r; }} onNext={() => advanceLab('bun')} isLast={false} flex={1} />
        </View>
        {/* Row 2: K CO2 Cr Glu */}
        <View style={s.fishBmpRow}>
          <LabCell label="K"   value={labs.k ?? ''}   onChange={v => patchLab('k', v)}
            inputRef={r => { labRefs.current.k = r; }} onNext={() => advanceLab('k')} isLast={false} borderRight flex={1} />
          <LabCell label="CO2" value={labs.co2 ?? ''} onChange={v => patchLab('co2', v)}
            inputRef={r => { labRefs.current.co2 = r; }} onNext={() => advanceLab('co2')} isLast={false} borderRight flex={1} />
          <LabCell label="Cr"  value={labs.cr ?? ''}  onChange={v => patchLab('cr', v)}
            inputRef={r => { labRefs.current.cr = r; }} onNext={() => advanceLab('cr')} isLast={false} borderRight flex={1} />
          <LabCell label="Glu" value={labs.glu ?? ''} onChange={v => patchLab('glu', v)}
            inputRef={r => { labRefs.current.glu = r; }} onNext={() => advanceLab('glu')} isLast={true} flex={1} />
        </View>
      </View>

      {/* ── Diagnostics ────────────────────── */}
      <Text style={s.sectionTitle}>Diagnostics</Text>
      <TextInput style={s.note} value={local.diagnostics ?? ''} onChangeText={v => patch({ diagnostics: v })}
        multiline placeholder="Imaging, EKG, procedures…" placeholderTextColor="#CCC" />

      {/* ── A/P ────────────────────────────── */}
      <Text style={s.sectionTitle}>Assessment / Plan</Text>
      <TextInput style={[s.note, { minHeight: 120 }]} value={local.ap ?? ''} onChangeText={v => patch({ ap: v })}
        multiline placeholder="Assessment and plan…" placeholderTextColor="#CCC" />

    </ScrollView>
  );
}

const BORDER = '#E5E5EA';

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },

  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 20, marginBottom: 8,
  },

  note: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1C1C1E',
    minHeight: 80, textAlignVertical: 'top',
  },

  // Vitals
  vitRow: { flexDirection: 'row', gap: 8 },
  vitCell: { flex: 1, alignItems: 'center' },
  vitLabel: { fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  vitInput: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 10, fontSize: 15, color: '#1C1C1E', width: '100%' },
  bpRow: { flexDirection: 'row', alignItems: 'center', gap: 3, width: '100%' },
  bpSlash: { fontSize: 18, color: '#BBB', fontWeight: '300' },

  // O2
  o2Row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  o2Pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  o2PillActive: { backgroundColor: '#1C1C1E' },
  o2PillText: { fontSize: 13, fontWeight: '500', color: '#555' },
  o2PillTextActive: { color: '#fff' },
  o2Input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: BORDER, paddingVertical: 8, fontSize: 15, color: '#1C1C1E' },

  // Fishbone
  fishLabel: { fontSize: 11, fontWeight: '600', color: '#BBB', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fishBox: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: BORDER, overflow: 'hidden' },
  fishRowBox: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: BORDER, overflow: 'hidden', flexDirection: 'row' },
  fishBmpRow: { flexDirection: 'row' },
  labCell: { paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center' },
  labLabel: { fontSize: 10, fontWeight: '600', color: '#999', marginBottom: 3 },
  labInput: { width: '100%', fontSize: 17, fontWeight: '500', color: '#1C1C1E', paddingVertical: 2 },

  // Shared borders
  borderRight: { borderRightWidth: 0.5, borderRightColor: BORDER },
  borderTop:   { height: 0.5, backgroundColor: BORDER },
  borderBottom: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
});
