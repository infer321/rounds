import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { usePatients } from '../context/PatientsContext';
import { useSlotCount } from '../hooks/useSlotCount';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { clearAll } = usePatients();
  const { slotCount, setSlotCount } = useSlotCount();

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

        {/* Timer Presets */}
        <Text style={styles.sectionTitle}>Timer Presets</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Presets')}>
            <View>
              <Text style={styles.rowLabel}>Change Timer Presets</Text>
              <Text style={styles.rowSub}>Add, edit, or remove presets</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
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

      </ScrollView>
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
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 6 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#E5E5EA', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  rowSub: { fontSize: 12, color: '#999', marginTop: 2 },
  rowArrow: { fontSize: 20, color: '#999' },
  destructiveArrow: { fontSize: 20, color: '#E24B4A' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText: { fontSize: 20, color: '#1C1C1E', fontWeight: '400', lineHeight: 24 },
  stepValue: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', minWidth: 24, textAlign: 'center' },
});
