/**
 * ExamBuilderScreen
 *
 * Full-screen physical exam builder. Each finding chip cycles through
 * three states on tap:
 *   null (non-contributory) → pos (pertinent positive) → neg (pertinent negative) → null
 *
 * Changes are saved to context immediately on every tap / keystroke.
 * Navigating back shows updated findings in the H&P and SOAP tabs.
 */
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { EXAM_SECTIONS } from '../data/examSections';

type RouteProps = RouteProp<RootStackParamList, 'ExamBuilder'>;

// ── 3-state chip color scheme ─────────────────────────────────
const CHIP = {
  null: { bg: '#F5F5F7', border: '#E5E5EA', text: '#BBB' },
  pos:  { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' },
  neg:  { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' },
};

export default function ExamBuilderScreen() {
  const navigation = useNavigation();
  const route      = useRoute<RouteProps>();
  const { patients, updateHP } = usePatients();
  const patient = patients.find(p => p.id === route.params.patientId);

  const [findings, setFindings] = useState<Record<string, 'pos' | 'neg'>>(
    patient?.hp?.examFindings ?? {}
  );
  const [notes, setNotes] = useState<Record<string, string>>(
    patient?.hp?.examNotes ?? {}
  );
  const [showSensitive, setShowSensitive] = useState(false);

  if (!patient) return null;

  // Cycle: null → pos → neg → null
  function cycle(key: string) {
    const cur = findings[key];
    const next = !cur ? 'pos' : cur === 'pos' ? 'neg' : undefined;
    const newFindings = { ...findings };
    if (next) newFindings[key] = next as 'pos' | 'neg';
    else delete newFindings[key];
    setFindings(newFindings);
    updateHP(patient!.id, { ...patient!.hp, examFindings: newFindings, examNotes: notes });
  }

  function updateNote(secKey: string, val: string) {
    const newNotes = { ...notes, [secKey]: val };
    setNotes(newNotes);
    updateHP(patient!.id, { ...patient!.hp, examFindings: findings, examNotes: newNotes });
  }

  const activeSections = EXAM_SECTIONS.filter(s => s.always || showSensitive);

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Physical Exam</Text>
        <TouchableOpacity
          style={s.clearBtn}
          onPress={() => {
            setFindings({});
            updateHP(patient!.id, { ...patient!.hp, examFindings: {}, examNotes: {} });
          }}
        >
          <Text style={s.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.sensitiveBtn, showSensitive && s.sensitiveBtnOn]}
          onPress={() => setShowSensitive(v => !v)}
        >
          <Text style={[s.sensitiveBtnText, showSensitive && s.sensitiveBtnTextOn]}>
            Sensitive Exams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        <View style={[s.legendDot, { backgroundColor: CHIP.null.bg, borderColor: CHIP.null.border }]}>
          <Text style={[s.legendDotText, { color: CHIP.null.text }]}>—</Text>
        </View>
        <Text style={s.legendLabel}>not assessed</Text>
        <View style={[s.legendDot, { backgroundColor: CHIP.pos.bg, borderColor: CHIP.pos.border }]}>
          <Text style={[s.legendDotText, { color: CHIP.pos.text }]}>+</Text>
        </View>
        <Text style={s.legendLabel}>pertinent +</Text>
        <View style={[s.legendDot, { backgroundColor: CHIP.neg.bg, borderColor: CHIP.neg.border }]}>
          <Text style={[s.legendDotText, { color: CHIP.neg.text }]}>−</Text>
        </View>
        <Text style={s.legendLabel}>pertinent −</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {activeSections.map((sec, si) => (
          <View key={sec.key} style={[s.section, si > 0 && s.sectionBorder]}>
            <Text style={s.secLabel}>{sec.label}</Text>
            <View style={s.chips}>
              {sec.findings.map(f => {
                const k     = `${sec.key}_${f.key}`;
                const state = findings[k] ?? null;
                const c     = CHIP[state ?? 'null'];
                // Show "+ Short" / "− Short" in pos/neg — keeps chips compact
                // and near-static in size (only the 2-char prefix changes).
                const label = state === 'pos' ? `+ ${f.short}` : state === 'neg' ? `− ${f.short}` : f.short;
                // Sizer = "− Short": widest the chip ever gets (2 chars > null).
                // Invisible in normal flow so the chip width never shifts on tap.
                const sizer = `− ${f.short}`;
                return (
                  <TouchableOpacity
                    key={k}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    onPress={() => cycle(k)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
                      {/* Sizer text (invisible) — locks chip width */}
                      <Text style={[s.chipText, { opacity: 0 }]}>{sizer}</Text>
                      {/* Label centered via flex in an absoluteFill view —
                          the only reliable vertical-center on iOS */}
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

  sensitiveBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: '#F0F0F0', borderWidth: 0.5, borderColor: '#DDD',
  },
  sensitiveBtnOn: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  sensitiveBtnText: { fontSize: 11, fontWeight: '600', color: '#666' },
  sensitiveBtnTextOn: { color: '#fff' },

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

  section: { paddingVertical: 8 },
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
