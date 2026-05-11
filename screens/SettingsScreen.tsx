import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Modal, TextInput, Pressable, Alert,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { usePatients } from '../context/PatientsContext';
import { usePresets } from '../hooks/usePresets';
import { useSlotCount } from '../hooks/useSlotCount';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { clearAll } = usePatients();
  const { presets, custom, addPreset, deletePreset } = usePresets();
  const { slotCount, setSlotCount } = useSlotCount();

  const [addVisible, setAddVisible] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDuration, setNewDuration] = useState('');

  function handleAddPreset() {
    if (!newLabel.trim() || !newDuration.trim()) return;
    addPreset(newLabel, newDuration);
    setNewLabel('');
    setNewDuration('');
    setAddVisible(false);
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

        {/* Patient slots */}
        <Text style={styles.sectionTitle}>Patient Slots</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Slots on home screen</Text>
              <Text style={styles.rowSub}>Min 1 · Max 16</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepBtn, slotCount <= 1 && styles.stepBtnDisabled]}
                onPress={() => setSlotCount(slotCount - 1)}
                disabled={slotCount <= 1}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{slotCount}</Text>
              <TouchableOpacity
                style={[styles.stepBtn, slotCount >= 16 && styles.stepBtnDisabled]}
                onPress={() => setSlotCount(slotCount + 1)}
                disabled={slotCount >= 16}
              >
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
          <TouchableOpacity onPress={() => { setNewLabel(''); setNewDuration(''); setAddVisible(true); }}>
            <Text style={styles.sectionAction}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {presets.map((preset, i) => (
            <View key={preset.id} style={[styles.presetRow, i < presets.length - 1 && styles.rowBorder]}>
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <View style={styles.presetRight}>
                <Text style={styles.presetDuration}>{preset.duration}</Text>
                {!preset.builtIn && (
                  <TouchableOpacity onPress={() => deletePreset(preset.id)} hitSlop={8}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.hint}>Built-in presets can't be removed. Custom presets appear at the bottom of the list.</Text>
      </ScrollView>

      {/* Add Preset Modal */}
      <Modal visible={addVisible} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setAddVisible(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Preset</Text>
            <TextInput
              style={styles.input}
              placeholder="Label (e.g. Echo results)"
              placeholderTextColor="#BBB"
              value={newLabel}
              onChangeText={setNewLabel}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (e.g. 2h, 30m)"
              placeholderTextColor="#BBB"
              value={newDuration}
              onChangeText={setNewDuration}
              returnKeyType="done"
              onSubmitEditing={handleAddPreset}
            />
            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!newLabel.trim() || !newDuration.trim()) && styles.confirmBtnDisabled]}
                onPress={handleAddPreset}
                disabled={!newLabel.trim() || !newDuration.trim()}
              >
                <Text style={styles.confirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
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
  presetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  presetLabel: { fontSize: 15, color: '#1C1C1E', flex: 1 },
  presetRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  presetDuration: { fontSize: 14, color: '#999', fontVariant: ['tabular-nums'] },
  deleteBtn: { fontSize: 14, color: '#E24B4A' },
  hint: { fontSize: 12, color: '#BBB', textAlign: 'center', marginTop: 4 },
  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 16 },
  input: { backgroundColor: '#F5F5F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1C1C1E', marginBottom: 12 },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#555', fontWeight: '500' },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1C1C1E', alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#CCC' },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
