import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSettings, Preset } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { hmStr, toHM } from '../utils/time';
import DurationPicker from '../components/DurationPicker';
import Sheet, { Btn } from '../components/Sheet';
import Icon from '../components/Icon';
import { Screen, ScreenHeader, Field, ui } from '../components/ui';
import { C, T, S } from '../theme';


export default function PresetsScreen() {
  const { presets, hasHiddenBuiltIns, addPreset, editPreset, deletePreset, restoreDefaults } = useSettings();
  const toast = useToast();

  const [target, setTarget] = useState<Preset | 'new' | null>(null);
  const [label, setLabel] = useState('');
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);

  function open(p: Preset | 'new') {
    const d = p === 'new' ? { h: 1, m: 0 } : toHM(p.duration);
    setLabel(p === 'new' ? '' : p.label); setH(d.h); setM(d.m); setTarget(p);
  }
  function save() {
    if (!label.trim() || (!h && !m)) return;
    if (target === 'new') addPreset(label, hmStr(h, m));
    else if (target) editPreset(target.id, label, hmStr(h, m));
    setTarget(null);
  }
  function remove(p: Preset) {
    deletePreset(p.id);
    toast({ message: `Removed ${p.label}`, onUndo: () => (p.builtIn ? editPreset(p.id, p.label, p.duration) : addPreset(p.label, p.duration)) });
  }

  return (
    <Screen>
      <ScreenHeader title="Timer presets"
        right={<Pressable onPress={() => open('new')} hitSlop={8} style={st.add} accessibilityLabel="New preset"><Icon name="plus" size={18} color="#fff" strokeWidth={2.25} /></Pressable>} />

      <ScrollView contentContainerStyle={st.content}>
        <View style={ui.card}>
          {presets.map((p, i) => (
            <Pressable key={p.id} onPress={() => open(p)} style={({ pressed }) => [st.row, i > 0 && st.rowDiv, pressed && { backgroundColor: C.sunken }]}>
              <Text style={[T.body, { flex: 1 }]}>{p.label}</Text>
              <Text style={st.dur}>{p.duration}</Text>
              <Pressable hitSlop={10} onPress={() => remove(p)} accessibilityLabel={`Remove ${p.label}`}>
                <Icon name="trash" size={17} color={C.ink4} />
              </Pressable>
            </Pressable>
          ))}
        </View>
        {hasHiddenBuiltIns && (
          <Pressable onPress={restoreDefaults} style={st.restore}><Text style={[T.small, { color: C.ink }]}>Restore removed defaults</Text></Pressable>
        )}
      </ScrollView>

      <Sheet visible={!!target} onClose={() => setTarget(null)} title={target === 'new' ? 'New preset' : 'Edit preset'}
        footer={<><Btn label="Cancel" kind="secondary" onPress={() => setTarget(null)} /><Btn label="Save" onPress={save} disabled={!label.trim() || (!h && !m)} flex={2} /></>}>
        <Field value={label} onChangeText={setLabel} placeholder="e.g. Repeat lactate" autoFocus={target === 'new'} />
        <View style={{ marginTop: S.md }}><DurationPicker hours={h} minutes={m} onHoursChange={setH} onMinutesChange={setM} /></View>
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  add:    { width: 34, height: 34, borderRadius: 17, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  content:{ paddingHorizontal: S.lg, paddingBottom: 60 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 14 },
  rowDiv: { borderTopWidth: 0.5, borderTopColor: C.line },
  dur:    { ...T.small, ...T.num },
  restore:{ alignSelf: 'center', marginTop: S.lg, padding: S.sm },
});
