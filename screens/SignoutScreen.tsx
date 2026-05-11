import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { usePatients } from '../context/PatientsContext';
import { COLORS, TEXT_COLORS } from '../data/patients';

export default function SignoutScreen() {
  const navigation = useNavigation();
  const { patients, markDone } = usePatients();

  const signoutGroups = patients
    .map(p => ({
      patient: p,
      items: p.items.filter(i => i.signout),
    }))
    .filter(g => g.items.length > 0);

  const total = signoutGroups.reduce((sum, g) => sum + g.items.length, 0);
  const allClear = total === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Signout</Text>
          <Text style={styles.subtitle}>
            {allClear ? 'All clear — ready to hand off' : `${total} item${total !== 1 ? 's' : ''} remaining`}
          </Text>
        </View>
      </View>

      {allClear ? (
        <View style={styles.allClear}>
          <Text style={styles.allClearIcon}>✓</Text>
          <Text style={styles.allClearTitle}>Ready for handoff</Text>
          <Text style={styles.allClearSub}>No pending signout items</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {signoutGroups.map(({ patient, items }) => (
            <View key={patient.id} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.avatar, { backgroundColor: COLORS[patient.colorIndex] }]}>
                  <Text style={[styles.avatarText, { color: TEXT_COLORS[patient.colorIndex] }]}>
                    {patient.initials}
                  </Text>
                </View>
                <Text style={styles.groupLabel}>Patient {patient.initials}</Text>
                <Text style={styles.groupCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
              </View>

              {items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemRow}
                  onPress={() => markDone(patient.id, item.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.checkbox} />
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.tapHint}>tap to clear</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24, gap: 12 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#1C1C1E' },
  title: { fontSize: 24, fontWeight: '600', color: '#1C1C1E' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  list: { paddingHorizontal: 16, gap: 16, paddingBottom: 40 },
  group: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#E5E5EA' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '600' },
  groupLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  groupCount: { fontSize: 12, color: '#999' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#BA7517' },
  itemLabel: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  tapHint: { fontSize: 11, color: '#CCC' },
  allClear: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  allClearIcon: { fontSize: 48, color: '#1D9E75' },
  allClearTitle: { fontSize: 22, fontWeight: '600', color: '#1C1C1E' },
  allClearSub: { fontSize: 14, color: '#999' },
});
