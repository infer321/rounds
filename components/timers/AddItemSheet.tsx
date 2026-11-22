import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { ItemType } from '../../data/patients';
import { usePatients } from '../../context/PatientsContext';
import { useSettings } from '../../context/SettingsContext';
import { hmStr, toHM } from '../../utils/time';
import { tap, thud } from '../../utils/haptics';
import DurationPicker from '../DurationPicker';
import Sheet, { Btn } from '../Sheet';
import { Field, Segmented } from '../ui';
import Icon from '../Icon';
import { C, T, R, S } from '../../theme';

const TYPES = [['timer', 'Timer'], ['task', 'Task']] as const;

/** Add timers/tasks. Stays open so several can be added in a row. */
export default function AddItemSheet({ patientId, visible, onClose }: { patientId: string; visible: boolean; onClose: () => void }) {
  const { addItem } = usePatients();
  const { presets } = useSettings();
  const [type, setType] = useState<ItemType>('timer');
  const [label, setLabel] = useState('');
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [flag, setFlag] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const labelRef = useRef<TextInput>(null);

  const canAdd = !!label.trim() && (type === 'task' || h > 0 || m > 0);
  const q = label.trim().toLowerCase();
  const matches = type === 'timer' && q ? presets.filter(p => p.label.toLowerCase().includes(q) && p.label !== label).slice(0, 4) : [];

  function reset() { setType('timer'); setLabel(''); setH(0); setM(0); setFlag(false); setAdded([]); }
  function close() { onClose(); reset(); }

  async function add(lbl: string, duration?: string) {
    thud();
    await addItem(patientId, { type: duration ? 'timer' : type, label: lbl, signout: flag }, duration);
    setAdded(a => [...a, lbl]);
  }

  async function addCustom() {
    if (!canAdd) return;
    await add(label.trim(), type === 'timer' ? hmStr(h, m) : undefined);
    setLabel(''); setH(0); setM(0);
    labelRef.current?.focus();
  }

  return (
    <Sheet visible={visible} onClose={close} title="Add" subtitle={added.length ? `Added: ${added.join(', ')}` : undefined}
      footer={<>
        <Btn label="Done" kind="secondary" onPress={close} />
        <Btn label={type === 'timer' && canAdd ? `Add · ${hmStr(h, m)}` : 'Add'} onPress={addCustom} disabled={!canAdd} flex={2} />
      </>}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <Segmented options={TYPES} value={type} onChange={v => v && setType(v)} />

        {type === 'timer' && (
          <>
            <Text style={[T.label, st.gap]}>One tap to start</Text>
            <View style={st.presets}>
              {presets.map(p => (
                <Pressable key={p.id} onPress={() => add(p.label, p.duration)} style={({ pressed }) => [st.preset, pressed && { backgroundColor: C.sunken }]}>
                  <Text style={T.small} numberOfLines={1}>{p.label}</Text>
                  <Text style={st.dur}>{p.duration}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[T.label, st.gap]}>Custom</Text>
          </>
        )}

        <Field ref={labelRef} value={label} onChangeText={setLabel} returnKeyType="done" onSubmitEditing={addCustom} submitBehavior="submit"
          placeholder={type === 'timer' ? 'Label, e.g. Repeat K' : 'e.g. Call nephro re: HD'} />
        {matches.length > 0 && (
          <View style={st.matches}>
            {matches.map(p => (
              <Pressable key={p.id} style={st.match} onPress={() => { const d = toHM(p.duration); setLabel(p.label); setH(d.h); setM(d.m); }}>
                <Text style={T.small}>{p.label}</Text><Text style={st.dur}>{p.duration}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {type === 'timer' && <View style={st.gap}><DurationPicker hours={h} minutes={m} onHoursChange={setH} onMinutesChange={setM} /></View>}

        <Pressable style={st.flagRow} onPress={() => { tap(); setFlag(f => !f); }}>
          <View style={[st.box, flag && st.boxOn]}>{flag && <Icon name="check" size={14} color={C.onInk} strokeWidth={2.5} />}</View>
          <Text style={T.body}>Add to signout</Text>
        </Pressable>
      </ScrollView>
    </Sheet>
  );
}

const st = StyleSheet.create({
  gap:     { marginTop: S.lg, marginBottom: S.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  preset:  { width: '31.5%', backgroundColor: C.surface, borderRadius: R.sm, borderWidth: 0.5, borderColor: C.line, padding: 10 },
  dur:     { ...T.caption, ...T.num, marginTop: 2 },
  matches: { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, marginTop: 4 },
  match:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: S.md + 2, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: C.line },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.lg },
  box:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  boxOn:   { backgroundColor: C.flag, borderColor: C.flag },
});
