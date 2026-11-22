/**
 * Shared tri-state builder for Physical Exam and ROS.
 * Tap cycles: not assessed → normal/denies → abnormal/reports → not assessed.
 * (Negatives first: most of a documented exam is normal.)
 * Each section has a one-tap "all normal" that fills only unset findings.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { useToast } from '../context/ToastContext';
import { tap, thud } from '../utils/haptics';
import { Screen, ScreenHeader } from './ui';
import { C, T, R, S } from '../theme';

type Finding = { key: string; short: string };
type Section = { key: string; label: string; always?: boolean; findings: Finding[] };
type State = Record<string, 'pos' | 'neg'>;

type Props = {
  title: string;
  sections: Section[];
  field: 'examFindings' | 'rosFindings';
  posWord: string;   // "abnormal" / "reports"
  negWord: string;   // "normal" / "denies"
  allNegLabel: string;
  sensitiveLabel?: string;
};

export default function FindingsBuilder({ title, sections, field, posWord, negWord, allNegLabel, sensitiveLabel }: Props) {
  const { params } = useRoute<RouteProp<RootStackParamList, 'ExamBuilder'>>();
  const { patients, patchHP } = usePatients();
  const toast = useToast();
  const [showSensitive, setShowSensitive] = useState(false);
  const patient = patients.find(p => p.id === params.patientId);
  if (!patient) return null;

  const pid = patient.id;
  const state: State = patient.hp?.[field] ?? {};
  const set = (next: State) => patchHP(pid, { [field]: next });
  const shown = sections.filter(s => s.always !== false || showSensitive);

  function cycle(k: string) {
    tap();
    const cur = state[k];
    const next = { ...state };
    if (!cur) next[k] = 'neg'; else if (cur === 'neg') next[k] = 'pos'; else delete next[k];
    set(next);
  }

  function allNeg(sec: Section) {
    thud();
    const next = { ...state };
    sec.findings.forEach(f => { const k = `${sec.key}_${f.key}`; if (!next[k]) next[k] = 'neg'; });
    set(next);
  }

  function clearAll() {
    const before = state;
    set({});
    toast({ message: `${title} cleared`, onUndo: () => set(before) });
  }

  const count = Object.keys(state).length;

  return (
    <Screen>
      <ScreenHeader title={title} subtitle={`Tap: ${negWord} → ${posWord} → clear`}
        right={count > 0 && <Pressable onPress={clearAll} hitSlop={8}><Text style={[T.small, { color: C.high }]}>Clear</Text></Pressable>} />

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {shown.map(sec => {
          const allSet = sec.findings.every(f => state[`${sec.key}_${f.key}`]);
          return (
            <View key={sec.key} style={st.card}>
              <View style={st.secHead}>
                <Text style={T.label}>{sec.label}</Text>
                {!allSet && (
                  <Pressable onPress={() => allNeg(sec)} hitSlop={8} style={st.allBtn}>
                    <Text style={[T.caption, { color: C.ok }]}>{allNegLabel}</Text>
                  </Pressable>
                )}
              </View>
              <View style={st.chips}>
                {sec.findings.map(f => {
                  const k = `${sec.key}_${f.key}`;
                  const s = state[k];
                  return (
                    <Pressable key={k} onPress={() => cycle(k)} hitSlop={4}
                      style={[st.chip, s === 'neg' && st.neg, s === 'pos' && st.pos]}>
                      <Text style={[st.chipText, s === 'neg' && { color: C.ok }, s === 'pos' && { color: C.high, fontWeight: '600' }]}>
                        {s === 'pos' ? '+ ' : s === 'neg' ? '– ' : ''}{f.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        {sensitiveLabel && (
          <Pressable onPress={() => setShowSensitive(v => !v)} style={st.sensitive}>
            <Text style={[T.small, { color: C.ink }]}>{showSensitive ? 'Hide' : 'Show'} {sensitiveLabel}</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  content:{ paddingHorizontal: S.lg, paddingBottom: 60, gap: S.sm },
  card:   { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, padding: S.md },
  secHead:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm, minHeight: 20 },
  allBtn: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.pill, backgroundColor: C.okBg },
  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.pill, borderWidth: 0.5, borderColor: C.line, backgroundColor: C.bg },
  neg:    { backgroundColor: C.okBg, borderColor: C.okLine },
  pos:    { backgroundColor: C.highBg, borderColor: C.highLine },
  chipText: { ...T.small, color: C.ink2 },
  sensitive: { alignSelf: 'center', padding: S.md },
});
