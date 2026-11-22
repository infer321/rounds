/**
 * Daily checklist + antibiotic day counter. Values carry forward day to day
 * (code status and diet rarely change); antibiotic days count up on their own.
 */
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Abx, Daily, Patient } from '../../data/patients';
import { usePatients } from '../../context/PatientsContext';
import { useToast } from '../../context/ToastContext';
import { abxDay, startForDay } from '../../utils/abx';
import { uid } from '../../utils/id';
import { tap } from '../../utils/haptics';
import { Field } from '../ui';
import NoteField from './NoteField';
import { Section } from './Section';
import Icon from '../Icon';
import { C, T, R, S } from '../../theme';

const OPTIONS: { key: 'diet' | 'vte' | 'code'; label: string; choices: string[] }[] = [
  { key: 'code', label: 'Code',    choices: ['Full', 'DNR', 'DNR/DNI', 'Comfort'] },
  { key: 'diet', label: 'Diet',    choices: ['NPO', 'Clears', 'Regular', 'Cardiac', 'Diabetic', 'Renal', 'Tube feeds'] },
  { key: 'vte',  label: 'VTE ppx', choices: ['Heparin SQ', 'Enoxaparin', 'SCDs', 'Therapeutic AC', 'Ambulating'] },
];

function Chips({ choices, value, onChange }: { choices: string[]; value?: string; onChange: (v?: string) => void }) {
  return (
    <View style={st.chips}>
      {choices.map(c => {
        const on = c === value;
        return (
          <Pressable key={c} onPress={() => { tap(); onChange(on ? undefined : c); }} hitSlop={4}
            accessibilityRole="button" accessibilityState={{ selected: on }}
            style={[st.chip, on && st.chipOn]}>
            <Text style={[st.chipText, on && st.chipTextOn]}>{c}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function DailySection({ patient }: { patient: Patient }) {
  const { patchHP } = usePatients();
  const toast = useToast();
  const pid = patient.id;
  const hp = patient.hp ?? {};
  const daily = hp.daily ?? {};
  const abx = hp.abx ?? [];
  const [name, setName] = useState('');
  const [day, setDay] = useState(1);

  const setDaily = (p: Partial<Daily>) => patchHP(pid, h => ({ ...h, daily: { ...h.daily, ...p } }));
  const setAbx = (next: Abx[]) => patchHP(pid, { abx: next });

  function addAbx() {
    if (!name.trim()) return;
    tap();
    setAbx([...abx, { id: uid(), name: name.trim(), start: startForDay(day) }]);
    setName(''); setDay(1);
  }
  function removeAbx(a: Abx) {
    setAbx(abx.filter(x => x.id !== a.id));
    toast({ message: `Removed ${a.name}`, onUndo: () => patchHP(pid, h => ({ ...h, abx: [...(h.abx ?? []), a] })) });
  }
  const shiftDay = (a: Abx, d: number) =>
    setAbx(abx.map(x => (x.id === a.id ? { ...x, start: startForDay(Math.max(1, abxDay(x.start) + d)) } : x)));

  return (
    <Section title="Daily">
      <View style={st.card}>
        {OPTIONS.map(o => (
          <View key={o.key} style={st.row}>
            <Text style={st.label}>{o.label}</Text>
            <Chips choices={o.choices} value={daily[o.key]} onChange={v => setDaily({ [o.key]: v })} />
          </View>
        ))}
        <View style={st.row}>
          <Text style={st.label}>Lines / drains</Text>
          <NoteField bare value={daily.lines ?? ''} onCommit={v => setDaily({ lines: v })} placeholder="PIV x2, Foley, JP drain…" minHeight={28} />
        </View>
        <View style={st.row}>
          <Text style={st.label}>Dispo</Text>
          <NoteField bare value={daily.dispo ?? ''} onCommit={v => setDaily({ dispo: v })} placeholder="Home in 1-2 days, PT eval…" minHeight={28} />
        </View>

        <View style={[st.row, { borderBottomWidth: 0 }]}>
          <Text style={st.label}>Antibiotics</Text>
          {abx.map(a => {
            const d = abxDay(a.start);
            return (
              <View key={a.id} style={st.abx}>
                <Text style={[T.body, { flex: 1 }]} numberOfLines={1}>{a.name}</Text>
                <Pressable hitSlop={8} onPress={() => shiftDay(a, -1)} accessibilityLabel={`${a.name} one day earlier`} style={st.step}><Icon name="minus" size={12} strokeWidth={2.25} /></Pressable>
                <Text style={st.day}>Day {d}</Text>
                <Pressable hitSlop={8} onPress={() => shiftDay(a, 1)} accessibilityLabel={`${a.name} one day later`} style={st.step}><Icon name="plus" size={12} strokeWidth={2.25} /></Pressable>
                <Pressable hitSlop={10} onPress={() => removeAbx(a)} accessibilityLabel={`Remove ${a.name}`}><Icon name="close" size={16} color={C.ink4} /></Pressable>
              </View>
            );
          })}
          <View style={st.abxAdd}>
            <Field style={st.abxField} value={name} onChangeText={setName} placeholder="Add antibiotic" returnKeyType="done" onSubmitEditing={addAbx} />
            <Pressable hitSlop={8} onPress={() => setDay(d => Math.max(1, d - 1))} style={st.step} accessibilityLabel="Start day earlier"><Icon name="minus" size={12} strokeWidth={2.25} /></Pressable>
            <Text style={st.day}>D{day}</Text>
            <Pressable hitSlop={8} onPress={() => setDay(d => d + 1)} style={st.step} accessibilityLabel="Start day later"><Icon name="plus" size={12} strokeWidth={2.25} /></Pressable>
            <Pressable onPress={addAbx} disabled={!name.trim()} style={[st.addBtn, !name.trim() && { opacity: 0.35 }]} accessibilityLabel="Add antibiotic">
              <Icon name="check" size={16} color={C.onInk} strokeWidth={2.25} />
            </Pressable>
          </View>
        </View>
      </View>
    </Section>
  );
}

const st = StyleSheet.create({
  card:  { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md + 2 },
  row:   { paddingVertical: S.md, borderBottomWidth: 0.5, borderBottomColor: C.line, gap: 6 },
  label: { ...T.label, fontSize: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:  { paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.pill, borderWidth: 0.5, borderColor: C.line, backgroundColor: C.bg },
  chipOn:{ backgroundColor: C.ink, borderColor: C.ink },
  chipText: { ...T.small, color: C.ink2 },
  chipTextOn: { color: C.onInk, fontWeight: '600' },
  abx:   { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: 4 },
  day:   { ...T.bodyM, ...T.num, minWidth: 44, textAlign: 'center' },
  step:  { width: 26, height: 26, borderRadius: 13, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' },
  abxAdd:{ flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: 4 },
  abxField: { flex: 1, paddingVertical: 9 },
  addBtn:{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
});
