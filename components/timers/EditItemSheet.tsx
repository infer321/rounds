import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Item } from '../../data/patients';
import { addMinutes, hmStr, remainingHM } from '../../utils/time';
import { tap } from '../../utils/haptics';
import DurationPicker from '../DurationPicker';
import Sheet, { Btn } from '../Sheet';
import { Field } from '../ui';
import { C, T, R, S } from '../../theme';

const BUMPS = [[5, '+5m'], [15, '+15m'], [30, '+30m'], [60, '+1h']] as const;

type Props = {
  item: Item | null;
  onClose: () => void;
  onSave: (label: string, duration?: string) => void;  // duration only if time changed
  onDelete: () => void;
};

export default function EditItemSheet({ item, onClose, onSave, onDelete }: Props) {
  const [label, setLabel] = useState('');
  const [hm, setHm] = useState({ h: 0, m: 0 });

  useEffect(() => {
    if (!item) return;
    setLabel(item.label);
    setHm(remainingHM(item.endsAt));
  }, [item]);

  function save() {
    if (!item || !label.trim()) return;
    const orig = remainingHM(item.endsAt);
    const changed = item.type === 'timer' && (hm.h || hm.m) && (hm.h !== orig.h || hm.m !== orig.m);
    onSave(label.trim(), changed ? hmStr(hm.h, hm.m) : undefined);
  }

  return (
    <Sheet visible={!!item} onClose={onClose} title="Edit"
      footer={<><Btn label="Delete" kind="secondary" onPress={onDelete} /><Btn label="Save" onPress={save} disabled={!label.trim()} flex={2} /></>}>
      <Field value={label} onChangeText={setLabel} placeholder="Label" />
      {item?.type === 'timer' && (
        <>
          <Text style={[T.label, st.gap]}>Time remaining</Text>
          <View style={st.bumps}>
            {BUMPS.map(([n, l]) => (
              <Pressable key={n} style={st.bump} onPress={() => { tap(); setHm(x => addMinutes(x, n)); }}>
                <Text style={T.small}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <DurationPicker hours={hm.h} minutes={hm.m} onHoursChange={h => setHm(x => ({ ...x, h }))} onMinutesChange={m => setHm(x => ({ ...x, m }))} />
        </>
      )}
    </Sheet>
  );
}

const st = StyleSheet.create({
  gap:   { marginTop: S.lg, marginBottom: S.sm },
  bumps: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  bump:  { flex: 1, alignItems: 'center', paddingVertical: 9, backgroundColor: C.surface, borderRadius: R.sm, borderWidth: 0.5, borderColor: C.line },
});
