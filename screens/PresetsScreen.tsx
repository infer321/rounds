import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings, Preset } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import DurationPicker from '../components/DurationPicker';
import Sheet, { Btn } from '../components/Sheet';
import Icon from '../components/Icon';
import { C, T, R, S } from '../theme';

const toHM = (s: string) => {
  const h = s.match(/(\d+)\s*h/), m = s.match(/(\d+)\s*m/);
  return { h: h ? parseInt(h[1]) : 0, m: m ? parseInt(m[1]) : 0 };
};
const hmStr = (h: number, m: number) => (h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`);

export default function PresetsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
    <View style={[st.screen, { paddingTop: insets.top + S.sm }]}>
      <StatusBar style="dark" />
      <View style={st.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={st.iconBtn}><Icon name="back" size={22} /></Pressable>
        <Text style={[T.h2, { flex: 1 }]}>Timer presets</Text>
        <Pressable onPress={() => open('new')} hitSlop={8} style={st.add}><Icon name="plus" size={18} color="#fff" strokeWidth={2.25} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={st.content}>
        <View style={st.card}>
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
        <TextInput style={st.input} value={label} onChangeText={setLabel} placeholder="e.g. Repeat lactate" placeholderTextColor={C.ink4} autoFocus={target === 'new'} />
        <View style={{ marginTop: S.md }}><DurationPicker hours={h} minutes={m} onHoursChange={setH} onMinutesChange={setM} /></View>
      </Sheet>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md, marginBottom: S.md },
  iconBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  add:    { width: 34, height: 34, borderRadius: 17, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  content:{ paddingHorizontal: S.lg, paddingBottom: 60 },
  card:   { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.line, overflow: 'hidden' },
  row:    { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 14 },
  rowDiv: { borderTopWidth: 0.5, borderTopColor: C.line },
  dur:    { ...T.small, ...T.num },
  restore:{ alignSelf: 'center', marginTop: S.lg, padding: S.sm },
  input:  { ...T.body, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md + 2, paddingVertical: 13 },
});
