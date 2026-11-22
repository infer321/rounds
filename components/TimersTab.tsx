/**
 * Timers & tasks for one patient. Owns the 1-second clock so only this
 * list re-renders each tick (not the note editor).
 */
import { useState } from 'react';
import { Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Item, Patient } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useToast } from '../context/ToastContext';
import { useNow } from '../hooks/useNow';
import { sortItemsByUrgency } from '../utils/time';
import { success } from '../utils/haptics';
import ItemRow from './timers/ItemRow';
import AddItemSheet from './timers/AddItemSheet';
import EditItemSheet from './timers/EditItemSheet';
import Icon from './Icon';
import { C, T, R, S } from '../theme';

export default function TimersTab({ patient }: { patient: Patient }) {
  const { editItem, removeItem, restoreItem, toggleSignout } = usePatients();
  const toast = useToast();
  const now = useNow();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const pid = patient.id;

  function done(item: Item) {
    success();
    const removed = removeItem(pid, item.id);
    if (removed) toast({ message: `Done: ${removed.label}`, onUndo: () => restoreItem(pid, removed) });
  }

  return (
    <>
      <ScrollView contentContainerStyle={st.list} showsVerticalScrollIndicator={false}>
        {sortItemsByUrgency(patient.items, now).map(item => (
          <ItemRow key={item.id} item={item} now={now}
            onDone={() => done(item)} onEdit={() => setEditing(item)} onFlag={() => toggleSignout(pid, item.id)} />
        ))}
        <Pressable onPress={() => setAdding(true)} style={({ pressed }) => [st.add, pressed && { backgroundColor: C.sunken }]}>
          <Icon name="plus" size={18} color={C.ink2} />
          <Text style={[T.bodyM, { color: C.ink2 }]}>{patient.items.length ? 'Add timer or task' : 'Add the first timer or task'}</Text>
        </Pressable>
        {patient.items.length > 0 && <Text style={st.hint}>Tap the circle when done. Long-press to edit. Flag sends it to signout.</Text>}
      </ScrollView>

      <AddItemSheet patientId={pid} visible={adding} onClose={() => setAdding(false)} />
      <EditItemSheet item={editing} onClose={() => setEditing(null)}
        onSave={async (label, duration) => { const it = editing; setEditing(null); if (it) await editItem(pid, it.id, label, duration); }}
        onDelete={() => { const it = editing; setEditing(null); if (it) done(it); }} />
    </>
  );
}

const st = StyleSheet.create({
  list: { paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: 120, gap: S.sm },
  add:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, borderRadius: R.md, borderWidth: 1, borderStyle: 'dashed', borderColor: C.lineStrong, paddingVertical: S.lg },
  hint: { ...T.caption, textAlign: 'center', marginTop: S.sm, color: C.ink4 },
});
