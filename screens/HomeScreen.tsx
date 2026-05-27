import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { StatusBar } from 'expo-status-bar';
import { COLORS, TEXT_COLORS, DOT_COLORS, Patient } from '../data/patients';
import { usePatients } from '../context/PatientsContext';
import { useNow } from '../hooks/useNow';
import { formatCountdown, sortItemsByUrgency } from '../utils/time';
import { useSlotCount } from '../hooks/useSlotCount';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { patients, addPatient, deletePatient } = usePatients();
  const { slotCount } = useSlotCount();
  const now = useNow();
  const [modalVisible, setModalVisible] = useState(false);
  const [initials, setInitials] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; initials: string } | null>(null);

  const slots: (Patient | null)[] = [...patients];
  while (slots.length < slotCount) slots.push(null);

  function openAddModal() {
    setInitials('');
    setModalVisible(true);
  }

  function handleAddPatient() {
    if (!initials.trim()) return;
    const id = addPatient(initials);
    setModalVisible(false);
    navigation.navigate('Patient', { patientId: id });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Text style={styles.title}>Rounds</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {slots.map((patient, i) =>
          patient ? (
            <TouchableOpacity
              key={patient.id}
              onLongPress={() => setDeleteTarget({ id: patient.id, initials: patient.initials })}
              delayLongPress={500}
              style={[styles.card, patient.items.some(it =>
                it.endsAt ? formatCountdown(it.endsAt, now).isUrgent : !!it.urgent
              ) && styles.urgentCard]}
              onPress={() => navigation.navigate('Patient', { patientId: patient.id })}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: COLORS[patient.colorIndex] }]}>
                  <Text style={[styles.avatarText, { color: TEXT_COLORS[patient.colorIndex] }]}>
                    {patient.initials}
                  </Text>
                </View>
                <Text style={styles.itemCount}>{patient.items.length} items</Text>
              </View>
              {sortItemsByUrgency(patient.items, now).slice(0, 3).map(item => {
                const cd = item.endsAt ? formatCountdown(item.endsAt, now) : null;
                const isUrgent = cd ? cd.isUrgent : !!item.urgent;
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={[styles.dot, { backgroundColor: isUrgent ? '#E24B4A' : item.signout ? '#BA7517' : DOT_COLORS[item.type] }]} />
                    <Text style={[styles.itemLabel, isUrgent && styles.urgentText]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {cd && (
                      <Text style={[styles.itemTime, isUrgent && styles.urgentTime]}>{cd.display}</Text>
                    )}
                    {!cd && item.timeLeft && (
                      <Text style={styles.itemTime}>{item.timeLeft}</Text>
                    )}
                  </View>
                );
              })}
              {patient.items.length === 0 && (
                <Text style={styles.emptyHint}>Tap to add items</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity key={`empty-${i}`} style={styles.emptyCard} onPress={openAddModal}>
              <Text style={styles.emptyPlus}>+</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      <View style={styles.legend}>
        {[['#1D9E75','timer'],['#7F77DD','task'],['#BA7517','signout flag'],['#E24B4A','urgent']].map(([color, label]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>▦</Text>
          <Text style={[styles.navLabel, styles.navActive]}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Signout')}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Signout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.navIcon}>⚙</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Patient Modal */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setDeleteTarget(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: 28 }]}>
            <Text style={styles.sheetTitle}>Remove Patient {deleteTarget?.initials}?</Text>
            <Text style={styles.sheetSubtitle}>This will delete all their timers and tasks.</Text>
            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#E24B4A' }]}
                onPress={() => { deletePatient(deleteTarget!.id); setDeleteTarget(null); }}
              >
                <Text style={styles.confirmText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Patient Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.sheet}>
              <Text style={styles.sheetTitle}>New Patient</Text>
              <Text style={styles.sheetSubtitle}>Enter initials (2–3 letters)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. JM"
                placeholderTextColor="#BBB"
                value={initials}
                onChangeText={setInitials}
                autoFocus
                maxLength={3}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleAddPatient}
              />
              <View style={styles.sheetButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, !initials.trim() && styles.confirmBtnDisabled]}
                  onPress={handleAddPatient}
                  disabled={!initials.trim()}
                >
                  <Text style={styles.confirmText}>Add Patient</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', paddingTop: 60 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '600', color: '#1C1C1E' },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 22, color: '#1C1C1E', fontWeight: '300', lineHeight: 26 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, paddingBottom: 16 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 0.5, borderColor: '#E5E5EA', minHeight: 130 },
  urgentCard: { borderColor: '#E24B4A', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '600' },
  itemCount: { fontSize: 10, color: '#999' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  itemLabel: { fontSize: 11, color: '#555', flex: 1 },
  urgentText: { color: '#A32D2D', fontWeight: '600' },
  itemTime: { fontSize: 10, color: '#999' },
  urgentTime: { color: '#E24B4A', fontWeight: '600' },
  emptyHint: { fontSize: 10, color: '#CCC', marginTop: 6 },
  emptyCard: { width: '47%', minHeight: 130, borderRadius: 16, borderWidth: 0.5, borderColor: '#DDD', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  emptyPlus: { fontSize: 24, color: '#CCC', fontWeight: '300' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 5, height: 5, borderRadius: 3 },
  legendLabel: { fontSize: 10, color: '#999' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#E5E5EA', backgroundColor: '#fff' },
  navItem: { alignItems: 'center', gap: 2 },
  navIcon: { fontSize: 18, color: '#555' },
  navLabel: { fontSize: 10, color: '#999' },
  navActive: { color: '#1C1C1E', fontWeight: '600' },
  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, color: '#999', marginBottom: 20 },
  input: { backgroundColor: '#F5F5F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, fontWeight: '600', letterSpacing: 4, color: '#1C1C1E', textAlign: 'center', marginBottom: 20 },
  sheetButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#555', fontWeight: '500' },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1C1C1E', alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#CCC' },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
