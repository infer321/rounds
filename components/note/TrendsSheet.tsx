/**
 * Lab + vitals trend table built from the round snapshots ("Advance" /
 * "Complete round"). Columns = rounds (oldest → newest, then today's values).
 */
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { HAndP } from '../../data/patients';
import { LAB_LABEL, LAB_ORDER, LabKey, labFlag } from '../../utils/clinical';
import { flagColor } from '../LabFishbone';
import Icon from '../Icon';
import { C, T, S } from '../../theme';

type Row = { key: string; label: string; values: (string | undefined)[]; flag: (v?: string) => 'H' | 'L' | null };

function Spark({ values }: { values: (string | undefined)[] }) {
  const nums = values.map(v => (v ? parseFloat(v) : NaN));
  const pts = nums.map((n, i) => ({ n, i })).filter(p => !isNaN(p.n));
  if (pts.length < 2) return <View style={{ width: 48 }} />;
  const min = Math.min(...pts.map(p => p.n)), max = Math.max(...pts.map(p => p.n));
  const W = 48, H = 18, span = max - min || 1, last = nums.length - 1 || 1;
  const xy = pts.map(p => [(p.i / last) * (W - 4) + 2, H - 2 - ((p.n - min) / span) * (H - 4)]);
  const end = xy[xy.length - 1];
  return (
    <Svg width={W} height={H}>
      <Polyline points={xy.map(p => p.join(',')).join(' ')} stroke={C.ink3} strokeWidth={1.25} fill="none" />
      <Circle cx={end[0]} cy={end[1]} r={2} fill={C.ink} />
    </Svg>
  );
}

function fmtDate(ms: number) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TrendsSheet({ hp, visible, onClose }: { hp: HAndP; visible: boolean; onClose: () => void }) {
  const hist = hp.history ?? [];
  const cols = [...hist.map(h => fmtDate(h.at)), 'Now'];
  const rows: Row[] = [];

  const vit = (key: 'temp' | 'hr' | 'rr' | 'spo2', label: string) => ({
    key, label, values: [...hist.map(h => h.vitals?.[key]), hp.vitals?.[key]], flag: () => null,
  });
  rows.push(vit('temp', 'T'), vit('hr', 'HR'), vit('rr', 'RR'), vit('spo2', 'SpO₂'));
  rows.push({ key: 'bp', label: 'BP', values: [...hist.map(h => h.vitals?.bpS), hp.vitals?.bpS], flag: () => null });
  LAB_ORDER.forEach((k: LabKey) => rows.push({
    key: k, label: LAB_LABEL[k], values: [...hist.map(h => h.labs?.[k]), hp.labs?.[k]], flag: v => labFlag(k, v),
  }));
  const shown = rows.filter(r => r.values.some(Boolean));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={st.screen}>
        <View style={st.header}>
          <Text style={T.h2}>Trends</Text>
          <Pressable onPress={onClose} hitSlop={12}><Icon name="close" /></Pressable>
        </View>
        {shown.length === 0 || hist.length === 0 ? (
          <Text style={st.empty}>
            No history yet. Tap Advance on a panel, or Complete round, to save today's values and start a trend.
          </Text>
        ) : (
          <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: S.lg }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={st.tr}>
                <Text style={[st.th, st.first]} />
                <Text style={[st.th, { width: 56 }]} />
                {cols.map((c, i) => <Text key={i} style={st.th}>{c}</Text>)}
              </View>
              {shown.map(r => (
                <View key={r.key} style={st.tr}>
                  <Text style={[st.td, st.first, st.rowLabel]}>{r.label}</Text>
                  <View style={{ width: 56, justifyContent: 'center' }}><Spark values={r.values} /></View>
                  {r.values.map((v, i) => (
                    <Text key={i} style={[st.td, { color: flagColor(r.flag(v)) }, i === r.values.length - 1 && st.now]}>{v ?? '·'}</Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: S.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: S.lg, marginBottom: S.lg },
  empty:  { ...T.small, paddingHorizontal: S.lg, lineHeight: 20 },
  tr:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.line, minHeight: 36, alignItems: 'center' },
  th:     { ...T.label, width: 52, textAlign: 'right' },
  td:     { ...T.body, ...T.num, fontSize: 14, width: 52, textAlign: 'right' },
  first:  { width: 52, textAlign: 'left' },
  rowLabel: { ...T.caption, color: C.ink2 },
  now:    { fontWeight: '600' },
});
