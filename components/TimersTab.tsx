/**
 * Timers & tasks for one patient. Owns the 1-second clock so only this
 * list re-renders each tick (it used to re-render the whole H&P form).
 */
import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Item, ItemType, Patient } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useNow } from '../hooks/useNow';
import { formatCountdown, sortItemsByUrgency } from '../utils/time';
import { tap, thud, success } from '../utils/haptics';
import DurationPicker from './DurationPicker';
import Sheet, { Btn } from './Sheet';
import Icon from './Icon';
import { C, T, R, S } from '../theme';

const toHM = (str?: string) => {
  const h = str?.match(/(\d+)\s*h/), m = str?.match(/(\d+)\s*m/);
  return { h: h ? parseInt(h[1]) : 0, m: m ? parseInt(m[1]) : 0 };
};
const hmStr = (h: number, m: number) => (h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`);
const remainingHM = (endsAt?: number) => {
  const min = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 60_000)) : 0;
  return { h: Math.floor(min / 60), m: (Math.round((min % 60) / 5) * 5) % 60 };
};

export default function TimersTab({ patient }: { patient: Patient }) {
  const { addItem, editItem, removeItem, restoreItem, toggleSignout } = usePatients();
  const { presets } = useSettings();
  const toast = useToast();
  const now = useNow();
  const pid = patient.id;

  // Add sheet
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<ItemType>('timer');
  const [label, setLabel] = useState('');
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [flag, setFlag] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const labelRef = useRef<TextInput>(null);

  // Edit sheet (label + time)
  const [editing, setEditing] = useState<Item | null>(null);
  const [eLabel, setELabel] = useState('');
  const [eH, setEH] = useState(0);
  const [eM, setEM] = useState(0);

  const sorted = sortItemsByUrgency(patient.items, now);
  const matches = type === 'timer' && label.trim()
    ? presets.filter(p => p.label.toLowerCase().includes(label.trim().toLowerCase()) && p.label !== label)
    : [];
  const canAdd = !!label.trim() && (type === 'task' || h > 0 || m > 0);

  function openAdd() {
    setType('timer'); setLabel(''); setH(0); setM(0); setFlag(false); setAdded([]); setAdding(true);
  }

  async function quickAdd(p: { label: string; duration: string }) {
    thud();
    await addItem(pid, { type: 'timer', label: p.label, signout: flag }, p.duration);
    setAdded(a => [...a, p.label]);
  }

  async function addCustom() {
    if (!canAdd) return;
    thud();
    await addItem(pid, { type, label: label.trim(), signout: flag }, type === 'timer' ? hmStr(h, m) : undefined);
    setAdded(a => [...a, label.trim()]);
    setLabel(''); setH(0); setM(0);
    labelRef.current?.focus();
  }

  function openEdit(item: Item) {
    const r = remainingHM(item.endsAt);
    setEditing(item); setELabel(item.label); setEH(r.h); setEM(r.m);
  }

  async function saveEdit() {
    if (!editing || !eLabel.trim()) return;
    const timeChanged = editing.type === 'timer' && (eH > 0 || eM > 0) &&
      JSON.stringify(remainingHM(editing.endsAt)) !== JSON.stringify({ h: eH, m: eM });
    await editItem(pid, editing.id, eLabel.trim(), timeChanged ? hmStr(eH, eM) : undefined);
    setEditing(null);
  }

  function done(item: Item) {
    success();
    const removed = removeItem(pid, item.id);
    if (removed) toast({ message: `Done: ${removed.label}`, onUndo: () => restoreItem(pid, removed) });
  }

  return (
    <>
      <ScrollView contentContainerStyle={st.list} showsVerticalScrollIndicator={false}>
        {sorted.map(item => {
          const cd = item.endsAt ? formatCountdown(item.endsAt, now) : null;
          const hot = cd?.isUrgent;
          return (
            <Pressable key={item.id} onLongPress={() => { tap(); openEdit(item); }} delayLongPress={350}
              style={({ pressed }) => [st.row, cd?.isOverdue && st.rowOverdue, pressed && { backgroundColor: C.sunken }]}>
              <Pressable hitSlop={10} onPress={() => done(item)} style={st.check} accessibilityLabel={`Mark ${item.label} done`}>
                <View style={st.checkRing} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[T.body, hot && { color: C.high, fontWeight: '600' }]} numberOfLines={2}>{item.label}</Text>
                <Text style={st.meta}>{item.type === 'timer' ? 'Timer' : 'Task'}{item.signout ? '  ·  On signout' : ''}</Text>
              </View>
              {cd && (
                <Pressable hitSlop={8} onPress={() => openEdit(item)}
                  style={[st.time, hot && { backgroundColor: C.highBg }]}>
                  <Text style={[st.timeText, hot && { color: C.high }]}>{cd.display}</Text>
                </Pressable>
              )}
              <Pressable hitSlop={10} onPress={() => { tap(); toggleSignout(pid, item.id); }}
                accessibilityLabel="Toggle signout flag" style={[st.flagBtn, item.signout && { backgroundColor: C.flagBg }]}>
                <Icon name="flag" size={16} color={item.signout ? C.flag : C.ink4} strokeWidth={2} />
              </Pressable>
            </Pressable>
          );
        })}

        <Pressable onPress={openAdd} style={({ pressed }) => [st.addRow, pressed && { backgroundColor: C.sunken }]}>
          <Icon name="plus" size={18} color={C.ink2} />
          <Text style={[T.bodyM, { color: C.ink2 }]}>{patient.items.length ? 'Add timer or task' : 'Add the first timer or task'}</Text>
        </Pressable>
        {patient.items.length > 0 && <Text style={st.hint}>Tap the circle when done. Long-press to edit. Flag sends it to signout.</Text>}
      </ScrollView>

      {/* Add */}
      <Sheet visible={adding} onClose={() => setAdding(false)} title="Add"
        subtitle={added.length ? `Added: ${added.join(', ')}` : undefined}
        footer={<>
          <Btn label="Done" kind="secondary" onPress={() => setAdding(false)} />
          <Btn label={type === 'timer' && canAdd ? `Add · ${hmStr(h, m)}` : 'Add'} onPress={addCustom} disabled={!canAdd} flex={2} />
        </>}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View style={st.seg}>
            {(['timer', 'task'] as ItemType[]).map(t => (
              <Pressable key={t} style={[st.segBtn, type === t && st.segOn]} onPress={() => { tap(); setType(t); }}>
                <Text style={[T.bodyM, { color: type === t ? C.ink : C.ink3 }]}>{t === 'timer' ? 'Timer' : 'Task'}</Text>
              </Pressable>
            ))}
          </View>

          {type === 'timer' && (
            <>
              <Text style={[T.label, st.gap]}>One tap to start</Text>
              <View style={st.presets}>
                {presets.map(p => (
                  <Pressable key={p.id} onPress={() => quickAdd(p)} style={({ pressed }) => [st.preset, pressed && { backgroundColor: C.sunken }]}>
                    <Text style={T.small} numberOfLines={1}>{p.label}</Text>
                    <Text style={st.presetTime}>{p.duration}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[T.label, st.gap]}>Custom</Text>
            </>
          )}

          <TextInput
            ref={labelRef}
            style={st.input}
            placeholder={type === 'timer' ? 'Label, e.g. Repeat K' : 'e.g. Call nephro re: HD'}
            placeholderTextColor={C.ink4}
            value={label}
            onChangeText={setLabel}
            returnKeyType="done"
            onSubmitEditing={addCustom}
            submitBehavior="submit"
          />
          {matches.length > 0 && (
            <View style={st.matches}>
              {matches.slice(0, 4).map(p => (
                <Pressable key={p.id} style={st.match} onPress={() => { const d = toHM(p.duration); setLabel(p.label); setH(d.h); setM(d.m); }}>
                  <Text style={T.small}>{p.label}</Text><Text style={st.presetTime}>{p.duration}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {type === 'timer' && <View style={st.gap}><DurationPicker hours={h} minutes={m} onHoursChange={setH} onMinutesChange={setM} /></View>}

          <Pressable style={st.flagRow} onPress={() => { tap(); setFlag(f => !f); }}>
            <View style={[st.box, flag && st.boxOn]}>{flag && <Icon name="check" size={14} color="#fff" strokeWidth={2.5} />}</View>
            <Text style={T.body}>Add to signout</Text>
          </Pressable>
        </ScrollView>
      </Sheet>

      {/* Edit */}
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title="Edit"
        footer={<>
          <Btn label="Delete" kind="secondary" onPress={() => { const it = editing; setEditing(null); if (it) done(it); }} />
          <Btn label="Save" onPress={saveEdit} disabled={!eLabel.trim()} flex={2} />
        </>}>
        <TextInput style={st.input} value={eLabel} onChangeText={setELabel} placeholder="Label" placeholderTextColor={C.ink4} />
        {editing?.type === 'timer' && (
          <>
            <Text style={[T.label, st.gap]}>Time remaining</Text>
            <View style={st.bumps}>
              {[5, 15, 30, 60].map(n => (
                <Pressable key={n} style={st.bump} onPress={() => {
                  tap(); const total = eH * 60 + eM + n; setEH(Math.min(72, Math.floor(total / 60))); setEM(total % 60 - (total % 60) % 5);
                }}>
                  <Text style={T.small}>+{n < 60 ? `${n}m` : '1h'}</Text>
                </Pressable>
              ))}
            </View>
            <DurationPicker hours={eH} minutes={eM} onHoursChange={setEH} onMinutesChange={setEM} />
          </>
        )}
      </Sheet>
    </>
  );
}

const st = StyleSheet.create({
  list: { paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: 120, gap: S.sm },
  row:  { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingVertical: S.md, paddingHorizontal: S.md },
  rowOverdue: { borderColor: C.high },
  check: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  checkRing: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.lineStrong },
  meta: { ...T.caption, marginTop: 2 },
  time: { backgroundColor: C.sunken, borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 5 },
  timeText: { ...T.caption, ...T.num, color: C.ink, fontWeight: '600', fontSize: 13 },
  flagBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, borderRadius: R.md, borderWidth: 1, borderStyle: 'dashed', borderColor: C.lineStrong, paddingVertical: S.lg },
  hint: { ...T.caption, textAlign: 'center', marginTop: S.sm, color: C.ink4 },
  seg: { flexDirection: 'row', backgroundColor: C.sunken, borderRadius: R.md, padding: 3 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  segOn: { backgroundColor: C.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  gap: { marginTop: S.lg, marginBottom: S.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  preset: { width: '31.5%', backgroundColor: C.surface, borderRadius: R.sm, borderWidth: 0.5, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 10 },
  presetTime: { ...T.caption, ...T.num, marginTop: 2 },
  input: { ...T.body, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md + 2, paddingVertical: 13 },
  matches: { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, marginTop: 4 },
  match: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: S.md + 2, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: C.line },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.lg },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: C.flag, borderColor: C.flag },
  bumps: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  bump: { flex: 1, alignItems: 'center', paddingVertical: 9, backgroundColor: C.surface, borderRadius: R.sm, borderWidth: 0.5, borderColor: C.line },
});
