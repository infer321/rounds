import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Modal, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { usePatients } from '../context/PatientsContext';
import { usePresets, Preset } from '../hooks/usePresets';
import { useSlotCount } from '../hooks/useSlotCount';
import DurationPicker from '../components/DurationPicker';

function durationToHM(str: string): { h: number; m: number } {
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

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { clearAll } = usePatients();
  const { presets, custom, hasHiddenBuiltIns, addPreset, editPreset, deletePreset, restoreDefaults } = usePresets();
  const { slotCount, setSlotCount } = useSlotCount();

  // Add modal
  const [addVisible, setAddVisible] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newH, setNewH] = useState(0);
  const [newM, setNewM] = useState(0);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Preset | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editH, setEditH] = useState(0);
  const [editM, setEditM] = useState(0);

  function openAdd() {
    setNewLabel(''); setNewH(0); setNewM(0);
    setAddVisible(true);
  }

  function handleAdd() {
    if (!newLabel.trim() || (newH === 0 && newM === 0)) return;
    addPreset(newLabel, hmToDurationStr(newH, newM));
    setAddVisible(false);
  }

  function openEdit(preset: Preset) {
    const { h, m } = durationToHM(preset.duration);
    setEditTarget(preset);
    setEditLabel(preset.label);
    setEditH(h); setEditM(m);
  }

  function handleEdit() {
    if (!editTarget || !editLabel.trim()) return;
    editPreset(editTarget.id, editLabel, hmToDurationStr(editH, editM));
    setEditTarget(null);
  }

  function handleDelete(preset: Preset) {
    Alert.alert(
      `Remove "${preset.label}"?`,
      preset.builtIn ? 'You can restore it later with "Restore defaults".' : 'This preset will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deletePreset(preset.id) },
      ]
    );
  }

  function handleClearAll() {
    Alert.alert(
      'Start New Shift',
      'This will remove all patients and their items. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => { clearAll(); navigation.goBack(); } },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Patient Slots */}
        <Text style={styles.sectionTitle}>Patient Slots</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Slots on home screen</Text>
              <Text style={styles.rowSub}>Min 1 · Max 16</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={[styles.stepBtn, slotCount <= 1 && styles.stepBtnDisabled]} onPress={() => setSlotCount(slotCount - 1)} disabled={slotCount <= 1}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{slotCount}</Text>
              <TouchableOpacity style={[styles.stepBtn, slotCount >= 16 && styles.stepBtnDisabled]} onPress={() => setSlotCount(slotCount + 1)} disabled={slotCount >= 16}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Shift */}
        <Text style={styles.sectionTitle}>Shift</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleClearAll}>
            <View>
              <Text style={styles.rowLabel}>Start new shift</Text>
              <Text style={styles.rowSub}>Clears all patients and items</Text>
            </View>
            <Text style={styles.destructiveArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Timer Presets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Timer Presets</Text>
          <TouchableOpacity onPress={openAdd}>
            <Text style={styles.sectionAction}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {presets.map((preset, i) => (
            <TouchableOpacity
              key={preset.id}
              style={[styles.presetRow, i < presets.length - 1 && styles.rowBorder]}
              onPress={() => openEdit(preset)}
              activeOpacity={0.7}
            >
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <View style={styles.presetRight}>
                <Text style={styles.presetDuration}>{preset.duration}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(preset)}
                  hitSlop={10}
                  style={styles.deleteTap}
                >
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {hasHiddenBuiltIns && (
          <TouchableOpacity onPress={restoreDefaults} style={styles.restoreRow}>
            <Text style={styles.restoreText}>↺ Restore removed defaults</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.hint}>Tap any preset to edit name or time.</Text>
      </ScrollView>

      {/* ── ADD PRESET MODAL ── */}
      <Modal visible={addVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOuter} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setAddVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Preset</Text>
              <TouchableOpacity onPress={() => setAddVisible(false)} hitSlop={10} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Label (e.g. Echo results)"
                placeholderTextColor="#BBB"
                value={newLabel}
                onChangeText={setNewLabel}
                autoFocus
                returnKeyType="done"
              />
              <Text style={styles.fieldLabel}>Duration</Text>
              <DurationPicker hours={newH} minutes={newM} onHoursChange={setNewH} onMinutesChange={setNewM} />
            </ScrollView>
            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!newLabel.trim() || (newH === 0 && newM === 0)) && styles.confirmBtnDisabled]}
                onPress={handleAdd}
                disabled={!newLabel.trim() || (newH === 0 && newM === 0)}
              >
                <Text style={styles.confirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── EDIT PRESET MODAL ── */}
      <Modal visible={!!editTarget} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOuter} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={() => setEditTarget(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Preset</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)} hitSlop={10} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                value={editLabel}
                onChangeText={setEditLabel}
                autoFocus
                returnKeyType="done"
              />
              <Text style={styles.fieldLabel}>Duration</Text>
              <DurationPicker hours={editH} minutes={editM} onHoursChange={setEditH} onMinutesChange={setEditM} />
            </ScrollView>
            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditTarget(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !editLabel.trim() && styles.confirmBtnDisabled]}
                onPress={handleEdit}
                disabled={!editLabel.trim()}
              >
                <Text style={styles.confirmText}>Save</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24, gap: 12 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#1C1C1E' },
  title: { fontSize: 24, fontWeight: '600', color: '#1C1C1E' },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 6 },
  sectionAction: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#E5E5EA', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  rowLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  rowSub: { fontSize: 12, color: '#999', marginTop: 2 },
  destructiveArrow: { fontSize: 20, color: '#E24B4A' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText: { fontSize: 20, color: '#1C1C1E', fontWeight: '400', lineHeight: 24 },
  stepValue: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', minWidth: 24, textAlign: 'center' },
  presetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  presetLabel: { fontSize: 15, color: '#1C1C1E', flex: 1 },
  presetRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  presetDuration: { fontSize: 14, color: '#999', fontVariant: ['tabular-nums'] },
  deleteTap: { padding: 4 },
  deleteBtn: { fontSize: 15, color: '#E24B4A' },
  restoreRow: { alignItems: 'center', paddingVertical: 10 },
  restoreText: { fontSize: 13, color: '#999', textDecorationLine: 'underline' },
  hint: { fontSize: 12, color: '#BBB', textAlign: 'center', marginTop: 4 },
  // Modals
  modalOuter: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 12 },
  sheetFooter: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 32, borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: '#F5F5F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1C1C1E', marginBottom: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#555', fontWeight: '500' },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1C1C1E', alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#CCC' },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
