import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Modal, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { usePresets, Preset } from '../hooks/usePresets';
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

export default function PresetsScreen() {
  const navigation = useNavigation();
  const { presets, hasHiddenBuiltIns, addPreset, editPreset, deletePreset, restoreDefaults } = usePresets();

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Timer Presets</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

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
                <TouchableOpacity onPress={() => handleDelete(preset)} hitSlop={10} style={styles.deleteTap}>
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
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: '#1C1C1E' },
  title: { flex: 1, fontSize: 24, fontWeight: '600', color: '#1C1C1E' },
  addBtn: { backgroundColor: '#1C1C1E', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#E5E5EA', overflow: 'hidden' },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
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
