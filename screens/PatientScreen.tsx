import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useState, useRef } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { COLORS, TEXT_COLORS, DOT_COLORS, ItemType, Item } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { StatusBar } from 'expo-status-bar';
import { useNow } from '../hooks/useNow';
import { formatCountdown, sortItemsByUrgency } from '../utils/time';
import { usePresets } from '../hooks/usePresets';
import DurationPicker from '../components/DurationPicker';

type RouteProps = RouteProp<RootStackParamList, 'Patient'>;

const TYPE_LABELS: Record<ItemType, string> = { timer: 'Timer', task: 'Task' };
const TYPE_BG: Record<ItemType, string> = { timer: '#E1F5EE', task: '#EEEDFE' };
const TYPE_TEXT: Record<ItemType, string> = { timer: '#085041', task: '#3C3489' };

function durationToHM(str?: string): { h: number; m: number } {
  if (!str) return { h: 0, m: 0 };
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  return { h: hMatch ? parseInt(hMatch[1]) : 0, m: mMatch ? parseInt(mMatch[1]) : 0 };
}

function hmToDurationStr(h: number, m: number): string {
  if (h === 0 && m === 0) return '0m';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function PatientScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { patients, addItem, editItem, markDone, toggleSignout } = usePatients();
  const { presets } = usePresets();
  const now = useNow();
  const patient = patients.find(p => p.id === route.params.patientId);
  const labelRef = useRef<TextInput>(null);
  const addScrollRef = useRef<ScrollView>(null);

  // Add modal state
  const [addVisible, setAddVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<ItemType>('timer');
  const [customLabel, setCustomLabel] = useState('');
  const [pickerH, setPickerH] = useState(0);
  const [pickerM, setPickerM] = useState(0);
  const [flagSignout, setFlagSignout] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editH, setEditH] = useState(0);
  const [editM, setEditM] = useState(0);

  // Quick time-edit modal (tap countdown)
  const [timeTarget, setTimeTarget] = useState<Item | null>(null);
  const [timeH, setTimeH] = useState(0);
  const [timeM, setTimeM] = useState(0);

  if (!patient) return null;

  const suggestions = selectedType === 'timer' && customLabel.trim().length > 0
    ? presets.filter(p => p.label.toLowerCase().includes(customLabel.toLowerCase()))
    : [];

  function openAdd() {
    setSelectedType('timer');
    setCustomLabel('');
    setPickerH(0);
    setPickerM(0);
    setFlagSignout(false);
    setShowSuggestions(false);
    setAddedCount(0);
    setAddVisible(true);
  }

  function openEdit(item: Item) {
    const { h, m } = durationToHM(
      item.endsAt ? hmToDurationStr(
        Math.floor((item.endsAt - Date.now()) / 3600000),
        Math.floor(((item.endsAt - Date.now()) % 3600000) / 60000)
      ) : undefined
    );
    setEditTarget(item);
    setEditLabel(item.label);
    setEditH(Math.max(0, h));
    setEditM(Math.max(0, m));
  }

  function pickSuggestion(p: { label: string; duration: string }) {
    const { h, m } = durationToHM(p.duration);
    setCustomLabel(p.label);
    setPickerH(h);
    setPickerM(m);
    setShowSuggestions(false);
  }

  async function addPreset(p: { label: string; duration: string }) {
    await addItem(patient!.id, { type: 'timer', label: p.label, signout: flagSignout }, p.duration);
    setAddedCount(c => c + 1);
  }

  async function addCustom() {
    if (!customLabel.trim()) return;
    if (selectedType === 'timer' && pickerH === 0 && pickerM === 0) return;
    const dur = selectedType === 'timer' ? hmToDurationStr(pickerH, pickerM) : undefined;
    await addItem(patient!.id, { type: selectedType, label: customLabel.trim(), signout: flagSignout }, dur);
    setCustomLabel('');
    setPickerH(0);
    setPickerM(0);
    setShowSuggestions(false);
    setAddedCount(c => c + 1);
    labelRef.current?.focus();
  }

  async function saveEdit() {
    if (!editTarget || !editLabel.trim()) return;
    const isTimer = editTarget.type === 'timer';
    const dur = isTimer ? hmToDurationStr(editH, editM) : undefined;
    await editItem(patient!.id, editTarget.id, editLabel.trim(), dur);
    setEditTarget(null);
  }

  function openTimeEdit(item: Item) {
    const remaining = item.endsAt ? Math.max(0, item.endsAt - Date.now()) : 0;
    const totalMin = Math.ceil(remaining / 60_000);
    setTimeH(Math.floor(totalMin / 60));
    setTimeM(Math.round((totalMin % 60) / 5) * 5 % 60); // snap to nearest 5m
    setTimeTarget(item);
  }

  async function saveTimeEdit() {
    if (!timeTarget) return;
    await editItem(patient!.id, timeTarget.id, timeTarget.label, hmToDurationStr(timeH, timeM));
    setTimeTarget(null);
  }

  const canAddCustom = customLabel.trim().length > 0 &&
    (selectedType === 'task' || pickerH > 0 || pickerM > 0);

  const signoutCount = patient.items.filter(i => i.signout).length;
  const sorted = sortItemsByUrgency(patient.items, now);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: COLORS[patient.colorIndex] }]}>
          <Text style={[styles.avatarText, { color: TEXT_COLORS[patient.colorIndex] }]}>
            {patient.initials}
          </Text>
        </View>
        <Text style={styles.patientName}>Patient {patient.initials}</Text>
        <TouchableOpacity style={styles.addItemBtn} onPress={openAdd}>
          <Text style={styles.addItemText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {(['timer', 'task'] as ItemType[]).map(type => {
          const count = patient.items.filter(i => i.type === type).length;
          return (
            <View key={type} style={[styles.statChip, { backgroundColor: TYPE_BG[type] }]}>
              <View style={[styles.statDot, { backgroundColor: DOT_COLORS[type] }]} />
              <Text style={[styles.statText, { color: TYPE_TEXT[type] }]}>
                {count} {TYPE_LABELS[type]}{count !== 1 ? 's' : ''}
              </Text>
            </View>
          );
        })}
        {signoutCount > 0 && (
          <View style={[styles.statChip, { backgroundColor: '#FAEEDA' }]}>
            <View style={[styles.statDot, { backgroundColor: '#BA7517' }]} />
            <Text style={[styles.statText, { color: '#633806' }]}>{signoutCount} signout</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {patient.items.length === 0 && (
          <TouchableOpacity style={styles.emptyState} onPress={openAdd}>
            <Text style={styles.emptyStateText}>+ Add a timer or task</Text>
          </TouchableOpacity>
        )}
        {sorted.map(item => {
          const cd = item.endsAt ? formatCountdown(item.endsAt, now) : null;
          const isUrgent = cd ? cd.isUrgent : !!item.urgent;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, isUrgent && styles.urgentCard]}
              onLongPress={() => openEdit(item)}
              delayLongPress={400}
              activeOpacity={0.85}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.typeBadge, { backgroundColor: TYPE_BG[item.type] }]}>
                  <Text style={[styles.typeBadgeText, { color: TYPE_TEXT[item.type] }]}>
                    {TYPE_LABELS[item.type]}
                  </Text>
                </View>
                <Text style={[styles.itemLabel, isUrgent && styles.urgentLabel]}>{item.label}</Text>
              </View>
              <View style={styles.itemRight}>
                {cd && (
                  <TouchableOpacity onPress={() => openTimeEdit(item)} hitSlop={8}>
                    <Text style={[styles.timeLeft, isUrgent && styles.urgentTime, styles.timeLeftTappable]}>
                      {cd.display}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.signoutBox, item.signout && styles.signoutBoxChecked]}
                  onPress={() => toggleSignout(patient.id, item.id)}
                  hitSlop={8}
                >
                  {item.signout && <Text style={styles.signoutCheck}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneBtn} onPress={() => markDone(patient.id, item.id)}>
                  <Text style={styles.doneBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── ADD ITEMS MODAL ── */}
      <Modal visible={addVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOuter} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setAddVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Add Items{addedCount > 0 ? `  ` : ''}
                {addedCount > 0 && <Text style={styles.addedBadge}>✓ {addedCount} added</Text>}
              </Text>
              <TouchableOpacity onPress={() => setAddVisible(false)} hitSlop={10} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={addScrollRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              {/* Type pills */}
              <View style={styles.typePills}>
                {(['timer', 'task'] as ItemType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, selectedType === type && styles.typePillActive]}
                    onPress={() => { setSelectedType(type); setCustomLabel(''); setShowSuggestions(false); }}
                  >
                    <Text style={[styles.typePillText, selectedType === type && styles.typePillTextActive]}>
                      {TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preset grid */}
              {selectedType === 'timer' && (
                <>
                  <View style={styles.presetGrid}>
                    {presets.map(p => (
                      <TouchableOpacity key={p.id} style={styles.presetChip} onPress={() => addPreset(p)}>
                        <Text style={styles.presetLabel} numberOfLines={1}>{p.label}</Text>
                        <Text style={styles.presetTime}>{p.duration}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>or custom</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </>
              )}

              {/* Custom label + autocomplete */}
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={labelRef}
                  style={styles.input}
                  placeholder={selectedType === 'timer' ? 'Custom label' : 'e.g. Consult nephro'}
                  placeholderTextColor="#BBB"
                  value={customLabel}
                  onChangeText={t => { setCustomLabel(t); setShowSuggestions(true); }}
                  onFocus={() => {
                    setShowSuggestions(true);
                    setTimeout(() => addScrollRef.current?.scrollToEnd({ animated: true }), 350);
                  }}
                  returnKeyType="done"
                  onSubmitEditing={canAddCustom ? addCustom : undefined}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.dropdown}>
                    {suggestions.map(s => (
                      <TouchableOpacity key={s.id} style={styles.dropdownRow} onPress={() => pickSuggestion(s)}>
                        <Text style={styles.dropdownLabel}>{s.label}</Text>
                        <Text style={styles.dropdownDuration}>{s.duration}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Duration picker */}
              {selectedType === 'timer' && (
                <DurationPicker
                  hours={pickerH}
                  minutes={pickerM}
                  onHoursChange={setPickerH}
                  onMinutesChange={setPickerM}
                />
              )}

              {/* Signout toggle */}
              <TouchableOpacity style={styles.signoutToggleRow} onPress={() => setFlagSignout(v => !v)}>
                <View style={[styles.signoutToggleBox, flagSignout && styles.signoutToggleBoxChecked]}>
                  {flagSignout && <Text style={styles.signoutToggleCheck}>✓</Text>}
                </View>
                <Text style={styles.signoutToggleLabel}>Flag for signout</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, !canAddCustom && styles.btnDisabled]}
                onPress={addCustom}
                disabled={!canAddCustom}
              >
                <Text style={styles.saveText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── QUICK TIME EDIT ── */}
      <Modal visible={!!timeTarget} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOuter} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setTimeTarget(null)} />
          <View style={styles.sheetSnug}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Change time</Text>
                {timeTarget && (
                  <Text style={styles.timeEditSub} numberOfLines={1}>{timeTarget.label}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setTimeTarget(null)} hitSlop={10} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetContent}>
              <DurationPicker
                hours={timeH}
                minutes={timeM}
                onHoursChange={setTimeH}
                onMinutesChange={setTimeM}
              />
            </View>

            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.addMoreBtn} onPress={() => setTimeTarget(null)}>
                <Text style={styles.addMoreText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, timeH === 0 && timeM === 0 && styles.btnDisabled]}
                onPress={saveTimeEdit}
                disabled={timeH === 0 && timeM === 0}
              >
                <Text style={styles.saveText}>Set {hmToDurationStr(timeH, timeM)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal visible={!!editTarget} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOuter} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setEditTarget(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Item</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} hitSlop={10} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <Text style={styles.fieldLabel}>Label</Text>
              <TextInput
                style={styles.input}
                value={editLabel}
                onChangeText={setEditLabel}
                autoFocus
                returnKeyType="done"
              />

              {editTarget?.type === 'timer' && (
                <>
                  <Text style={styles.fieldLabel}>Time remaining</Text>
                  <DurationPicker
                    hours={editH}
                    minutes={editM}
                    onHoursChange={setEditH}
                    onMinutesChange={setEditM}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.addMoreBtn} onPress={() => setEditTarget(null)}>
                <Text style={styles.addMoreText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !editLabel.trim() && styles.btnDisabled]}
                onPress={saveEdit}
                disabled={!editLabel.trim()}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#1C1C1E' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '600' },
  patientName: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  addItemBtn: { backgroundColor: '#1C1C1E', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addItemText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16, flexWrap: 'wrap' },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statDot: { width: 5, height: 5, borderRadius: 3 },
  statText: { fontSize: 12, fontWeight: '500' },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 40 },
  emptyState: { borderWidth: 0.5, borderColor: '#DDD', borderStyle: 'dashed', borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#AAA' },
  itemCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#E5E5EA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  urgentCard: { borderColor: '#E24B4A', borderWidth: 1 },
  itemLeft: { flex: 1, gap: 6 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  urgentLabel: { color: '#A32D2D' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeLeft: { fontSize: 13, color: '#999', fontVariant: ['tabular-nums'] },
  timeLeftTappable: { textDecorationLine: 'underline', textDecorationStyle: 'dotted' },
  urgentTime: { color: '#E24B4A', fontWeight: '600' },
  timeEditSub: { fontSize: 13, color: '#999', marginTop: 2 },
  signoutBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#D4A84B', alignItems: 'center', justifyContent: 'center' },
  signoutBoxChecked: { backgroundColor: '#BA7517', borderColor: '#BA7517' },
  signoutCheck: { fontSize: 12, color: '#fff', fontWeight: '700' },
  doneBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { fontSize: 12, color: '#999' },
  // Modal shared
  modalOuter: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  sheetSnug: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  addedBadge: { fontSize: 14, fontWeight: '600', color: '#1D9E75' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 12 },
  sheetFooter: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
  typePills: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typePill: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center' },
  typePillActive: { backgroundColor: '#1C1C1E' },
  typePillText: { fontSize: 13, fontWeight: '500', color: '#555' },
  typePillTextActive: { color: '#fff' },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  presetChip: { width: '47%', backgroundColor: '#F5F5F7', borderRadius: 12, padding: 10, borderWidth: 0.5, borderColor: '#E5E5EA' },
  presetLabel: { fontSize: 12, fontWeight: '500', color: '#333', marginBottom: 2 },
  presetTime: { fontSize: 11, color: '#999' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#E5E5EA' },
  dividerLabel: { fontSize: 12, color: '#BBB' },
  inputWrapper: { zIndex: 10, marginBottom: 12 },
  input: { backgroundColor: '#F5F5F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1C1C1E' },
  dropdown: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E5E5EA', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4, zIndex: 100 },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F7' },
  dropdownLabel: { fontSize: 14, color: '#1C1C1E' },
  dropdownDuration: { fontSize: 13, color: '#999' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  signoutToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 4 },
  signoutToggleBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#D4A84B', alignItems: 'center', justifyContent: 'center' },
  signoutToggleBoxChecked: { backgroundColor: '#BA7517', borderColor: '#BA7517' },
  signoutToggleCheck: { fontSize: 12, color: '#fff', fontWeight: '700' },
  signoutToggleLabel: { fontSize: 15, color: '#1C1C1E' },
  addMoreBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center' },
  addMoreText: { fontSize: 14, color: '#1C1C1E', fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1C1C1E', alignItems: 'center' },
  saveText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.35 },
});
