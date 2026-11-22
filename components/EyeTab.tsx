/**
 * Ophthalmology consult tab: OD/OS exam grid with one-tap normals,
 * shared HPI + A/P, and "Copy consult" in the standard eye-note order.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { EyeExam, EyePair, Patient } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useToast } from '../context/ToastContext';
import { useScrollToCenter } from '../hooks/useScrollToCenter';
import { buildEyeConsult } from '../utils/noteExport';
import { flagOf, IOP_RANGE } from '../utils/clinical';
import { success, tap } from '../utils/haptics';
import { memoData } from '../utils/memo';
import { flagColor } from './LabFishbone';
import NoteField from './note/NoteField';
import APSection from './note/APSection';
import { Section, SmallBtn } from './note/Section';
import { Segmented } from './ui';
import Icon from './Icon';
import { C, T, R, S } from '../theme';

type PairKey = 'va' | 'ph' | 'iop' | 'pupils' | 'eom' | 'cvf' | 'll' | 'cs' | 'k' | 'ac' | 'iris' | 'lens' | 'disc' | 'mac' | 'vessels' | 'periph';
type Eye = 'od' | 'os';

const VA_CHIPS = ['20/20', '20/25', '20/30', '20/40', '20/50', '20/70', '20/100', '20/200', 'CF', 'HM', 'LP', 'NLP'];

const NORMAL: Partial<Record<PairKey, string>> = {
  pupils: '3 to 2, brisk', eom: 'Full', cvf: 'Full to CF',
  ll: 'WNL', cs: 'White and quiet', k: 'Clear', ac: 'Deep and quiet', iris: 'Round and flat', lens: 'Clear',
  disc: '0.3 C/D, sharp, pink', mac: 'Flat, good reflex', vessels: 'Normal caliber', periph: 'Flat 360',
};

const SLE: [PairKey, string][] = [['ll', 'Lids / lashes'], ['cs', 'Conj / sclera'], ['k', 'Cornea'], ['ac', 'Ant. chamber'], ['iris', 'Iris'], ['lens', 'Lens']];
const DFE: [PairKey, string][] = [['disc', 'Disc'], ['mac', 'Macula'], ['vessels', 'Vessels'], ['periph', 'Periphery']];

type RowProps = {
  label: string; value?: EyePair; numeric?: boolean; flagIOP?: boolean;
  onChange: (eye: Eye, v: string) => void; onFocusEye?: (eye: Eye) => void;
};

function EyeRowBase({ label, value, numeric, flagIOP, onChange, onFocusEye }: RowProps) {
  const cell = (eye: Eye) => {
    const v = value?.[eye] ?? '';
    const color = flagIOP ? flagColor(flagOf(v, IOP_RANGE)) : C.ink;
    return (
      <TextInput
        style={[st.cell, { color }]} value={v} onChangeText={t => onChange(eye, t)}
        onFocus={() => onFocusEye?.(eye)}
        placeholder={eye.toUpperCase()} placeholderTextColor={C.ink4}
        keyboardType={numeric ? 'number-pad' : 'default'} maxLength={numeric ? 2 : 60}
        textAlign="center" maxFontSizeMultiplier={1.3} accessibilityLabel={`${label} ${eye.toUpperCase()}`}
      />
    );
  };
  return (
    <View style={st.row}>
      <Text style={st.rowLabel} numberOfLines={2}>{label}</Text>
      {cell('od')}
      {cell('os')}
    </View>
  );
}
const EyeRow = memoData(EyeRowBase);

export default function EyeTab({ patient }: { patient: Patient }) {
  const { patchHP } = usePatients();
  const toast = useToast();
  const { scrollRef, scrollProps, centerInput } = useScrollToCenter();
  const [vaEye, setVaEye] = useState<Eye>('od');
  const pid = patient.id;
  const hp = patient.hp ?? {};
  const e: EyeExam = hp.eye ?? {};

  const patchEye = (u: Partial<EyeExam> | ((e: EyeExam) => Partial<EyeExam>)) =>
    patchHP(pid, h => {
      const cur = h.eye ?? {};
      return { ...h, eye: { ...cur, ...(typeof u === 'function' ? u(cur) : u) } };
    });
  const setPair = (k: PairKey) => (eye: Eye, v: string) => patchEye(cur => ({ [k]: { ...cur[k], [eye]: v } }));

  function fillNormal(keys: PairKey[]) {
    tap();
    patchEye(cur => Object.fromEntries(keys.map(k => [k, {
      od: cur[k]?.od || NORMAL[k], os: cur[k]?.os || NORMAL[k],
    }])));
  }

  function vaChip(v: string) {
    tap();
    setPair('va')(vaEye, v);
    setVaEye(vaEye === 'od' ? 'os' : 'od');
  }

  async function copy() {
    await Clipboard.setStringAsync(buildEyeConsult(patient));
    success();
    toast({ message: 'Ophthalmology consult copied.' });
  }

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={st.content}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false} {...scrollProps}>
      <Pressable onPress={copy} style={({ pressed }) => [st.primary, pressed && { opacity: 0.85 }]} accessibilityRole="button">
        <Icon name="copy" size={16} color={C.onInk} strokeWidth={2} />
        <Text style={[T.bodyM, { color: C.onInk }]}>Copy ophthalmology consult</Text>
      </Pressable>

      <Section title="Reason for consult">
        <NoteField value={e.reason ?? ''} onCommit={v => patchEye({ reason: v })} placeholder="e.g. Sudden vision loss OS, r/o CRAO" minHeight={48} onFocused={centerInput} />
      </Section>

      <Section title="HPI">
        <NoteField value={hp.hpi ?? ''} onCommit={v => patchHP(pid, { hpi: v })} placeholder="Onset, eye, pain, flashes/floaters, trauma, contacts…" onFocused={centerInput} />
      </Section>

      <Section title="Vision, pressure, pupils">
        <View style={st.card}>
          <View style={st.headRow}><Text style={st.rowLabel} /><Text style={st.eyeHead}>OD</Text><Text style={st.eyeHead}>OS</Text></View>
          <View style={st.inline}>
            <Segmented options={[['cc', 'cc'], ['sc', 'sc']] as const} value={e.vaMethod ?? 'cc'} onChange={v => v && patchEye({ vaMethod: v })} size="sm" />
          </View>
          <EyeRow label="VA" value={e.va} onChange={setPair('va')} onFocusEye={setVaEye} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={st.vaChips}>
            <Text style={st.vaFor}>{vaEye.toUpperCase()}:</Text>
            {VA_CHIPS.map(v => (
              <Pressable key={v} onPress={() => vaChip(v)} style={st.vaChip} accessibilityLabel={`Set ${vaEye.toUpperCase()} visual acuity ${v}`}>
                <Text style={st.vaChipText}>{v}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <EyeRow label="Pinhole" value={e.ph} onChange={setPair('ph')} />
          <View style={st.inline}>
            <Segmented options={[['Tonopen', 'Tonopen'], ['iCare', 'iCare'], ['Applanation', 'Applan.']] as const}
              value={e.iopMethod} onChange={v => patchEye({ iopMethod: v })} allowNone size="sm" />
          </View>
          <EyeRow label="IOP" value={e.iop} numeric flagIOP onChange={setPair('iop')} />
          <EyeRow label="Pupils" value={e.pupils} onChange={setPair('pupils')} />
          <View style={st.inline}>
            <Text style={st.inlineLabel}>APD</Text>
            <Segmented options={[['None', 'None'], ['OD', 'OD'], ['OS', 'OS']] as const} value={e.apd} onChange={v => patchEye({ apd: v })} allowNone size="sm" />
          </View>
          <EyeRow label="EOM" value={e.eom} onChange={setPair('eom')} />
          <EyeRow label="CVF" value={e.cvf} onChange={setPair('cvf')} />
          <Pressable onPress={() => fillNormal(['pupils', 'eom', 'cvf'])} style={st.normal}>
            <Text style={st.normalText}>Fill normal pupils / EOM / CVF</Text>
          </Pressable>
        </View>
      </Section>

      <Section title="Slit lamp" action={<SmallBtn label="Normal OU" icon="check" onPress={() => fillNormal(SLE.map(x => x[0]))} />}>
        <View style={st.card}>
          {SLE.map(([k, l]) => <EyeRow key={k} label={l} value={e[k]} onChange={setPair(k)} />)}
        </View>
      </Section>

      <Section title="Fundus" action={<SmallBtn label="Normal OU" icon="check" onPress={() => fillNormal(DFE.map(x => x[0]))} />}>
        <View style={st.card}>
          <View style={st.inline}>
            <Segmented options={[['yes', 'Dilated'], ['no', 'Undilated']] as const}
              value={e.dilated === false ? 'no' : 'yes'} onChange={v => patchEye({ dilated: v !== 'no' })} size="sm" />
          </View>
          {DFE.map(([k, l]) => <EyeRow key={k} label={l} value={e[k]} onChange={setPair(k)} />)}
        </View>
      </Section>

      <APSection patient={patient} onCenter={centerInput} />
      <Text style={st.disclaimer}>Exam fields are your documentation aid. Verify urgent findings with the ophthalmology team.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: S.lg, paddingBottom: 140, paddingTop: S.sm },
  primary: { flexDirection: 'row', gap: S.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 12, marginBottom: S.sm },
  card:    { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md, paddingVertical: S.sm },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4 },
  eyeHead: { ...T.label, flex: 1, textAlign: 'center' },
  row:     { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: C.line },
  rowLabel:{ ...T.caption, color: C.ink2, width: 84 },
  cell:    { flex: 1, ...T.body, ...T.num, paddingVertical: 8, paddingHorizontal: 4, borderRadius: R.sm, backgroundColor: C.bg },
  inline:  { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: 6, paddingLeft: 84 + S.sm },
  inlineLabel: { ...T.caption, color: C.ink2, marginLeft: -(84 + S.sm), width: 84 },
  vaChips: { gap: 6, paddingVertical: 6, paddingLeft: 84 + S.sm, alignItems: 'center' },
  vaFor:   { ...T.caption, color: C.ink3 },
  vaChip:  { paddingHorizontal: 9, paddingVertical: 5, borderRadius: R.pill, backgroundColor: C.sunken },
  vaChipText: { ...T.caption, color: C.ink, ...T.num },
  normal:  { alignSelf: 'flex-start', marginTop: S.sm, marginBottom: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill, backgroundColor: C.okBg },
  normalText: { ...T.caption, color: C.ok },
  disclaimer: { ...T.caption, color: C.ink4, fontWeight: '400', marginTop: S.lg, textAlign: 'center' },
});
