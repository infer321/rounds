/**
 * ROSBuilderScreen
 *
 * Full-screen review of systems builder. Each symptom chip cycles through
 * three states on tap:
 *   null (not asked) → pos (patient reports) → neg (patient denies) → null
 *
 * Changes are saved to context immediately. Navigating back shows updated
 * findings in the H&P and SOAP tabs.
 */
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { ROS_SECTIONS } from '../data/rosSections';

type RouteProps = RouteProp<RootStackParamList, 'ROSBuilder'>;

// Same colour scheme as ExamBuilderScreen
const CHIP = {
  null: { bg: '#F5F5F7', border: '#E5E5EA', text: '#BBB' },
  pos:  { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' },
  neg:  { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' },
};

export default function ROSBuilderScreen() {
  const navigation = useNavigation();
  const route      = useRoute<RouteProps>();
  const { patients, updateHP } = usePatients();
  const patient = patients.find(p => p.id === route.params.patientId);

  const [findings, setFindings] = useState<Record<string, 'pos' | 'neg'>>(
    patient?.hp?.rosFindings ?? {}
  );

  if (!patient) return null;

  // Cycle: null → pos → neg → null
  function cycle(key: string) {
    const cur  = findings[key];
    const next = !cur ? 'pos' : cur === 'pos' ? 'neg' : undefined;
    const newFindings = { ...findings };
    if (next) newFindings[key] = next as 'pos' | 'neg';
    else delete newFindings[key];
    setFindings(newFindings);
    updateHP(patient!.id, { ...patient!.hp, rosFindings: newFindings });
  }

  function clearAll() {
    setFindings({});
    updateHP(patient!.id, { ...patient!.hp, rosFindings: {} });
  }

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Review of Systems</Text>
        <TouchableOpacity style={s.clearBtn} onPress={clearAll}>
          <Text style={s.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        <View style={[s.legendDot, { backgroundColor: CHIP.null.bg, borderColor: CHIP.null.border }]}>
          <Text style={[s.legendDotText, { color: CHIP.null.text }]}>—</Text>
        </View>
        <Text style={s.legendLabel}>not asked</Text>
        <View style={[s.legendDot, { backgroundColor: CHIP.pos.bg, borderColor: CHIP.pos.border }]}>
          <Text style={[s.legendDotText, { color: CHIP.pos.text }]}>+</Text>
        </View>
        <Text style={s.legendLabel}>reports</Text>
        <View style={[s.legendDot, { backgroundColor: CHIP.neg.bg, borderColor: CHIP.neg.border }]}>
          <Text style={[s.legendDotText, { color: CHIP.neg.text }]}>−</Text>
        </View>
        <Text style={s.legendLabel}>denies</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {ROS_SECTIONS.map((sec, si) => (
          <View key={sec.key} style={[s.section, si > 0 && s.sectionBorder]}>
            <Text style={s.secLabel}>{sec.label}</Text>
            <View style={s.chips}>
              {sec.findings.map(f => {
                const k     = `${sec.key}_${f.key}`;
                const state = findings[k] ?? null;
                const c     = CHIP[state ?? 'null'];
                const label = state === 'pos' ? `+ ${f.short}` : state === 'neg' ? `− ${f.short}` : f.short;
                const sizer = `− ${f.short}`;
                return (
                  <TouchableOpacity
                    key={k}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    onPress={() => cycle(k)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
                      <Text style={[s.chipText, { opacity: 0 }]}>{sizer}</Text>
                      <View style={[StyleSheet.absoluteFill, s.chipCenter]}>
                        <Text style={[s.chipText, { color: c.text }]}>{label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', paddingTop: 56 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, marginBottom: 4, gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 20, color: '#1C1C1E' },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1C1C1E' },

  clearBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: '#FFF0F0', borderWidth: 0.5, borderColor: '#FFBBBB',
  },
  clearBtnText: { fontSize: 11, fontWeight: '600', color: '#CC3333' },

  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, marginBottom: 6,
  },
  legendDot: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  legendDotText: { fontSize: 10, fontWeight: '700' },
  legendLabel: { fontSize: 10, color: '#999', marginRight: 6 },

  content: { paddingHorizontal: 14, paddingBottom: 32 },

  section:       { paddingVertical: 8 },
  sectionBorder: { borderTopWidth: 0.5, borderTopColor: '#EBEBEB' },
  secLabel: {
    fontSize: 10, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
  },

  chips:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  chipCenter:{ alignItems: 'center', justifyContent: 'center' },
  chipText:  { fontSize: 11, fontWeight: '500' },
});
