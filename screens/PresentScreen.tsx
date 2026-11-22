/**
 * Presenting view: large-type, read-only summary to read from on rounds.
 * Same content and order as the SOAP note. Arrows step through the list.
 */
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { dailyLines, examLines, imagingLines, labLines, oneLiner, rosLines, vitalsLine } from '../utils/noteExport';
import { Screen, ScreenHeader } from '../components/ui';
import Icon from '../components/Icon';
import { tap } from '../utils/haptics';
import { C, T, S } from '../theme';

function Block({ title, lines }: { title: string; lines: (string | undefined)[] }) {
  const body = lines.filter(Boolean) as string[];
  if (!body.length) return null;
  return (
    <View style={st.block}>
      <Text style={st.title}>{title}</Text>
      {body.map((l, i) => <Text key={i} style={l.startsWith('#') ? [st.line, st.header] : st.line}>{l}</Text>)}
    </View>
  );
}

export default function PresentScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Present'>>();
  const { patients } = usePatients();
  const idx = patients.findIndex(p => p.id === params.patientId);
  const p = patients[idx];
  if (!p) return null;
  const hp = p.hp ?? {};
  const go = (d: number) => {
    const next = patients[idx + d];
    if (next) { tap(); navigation.setParams({ patientId: next.id } as never); }
  };

  return (
    <Screen>
      <ScreenHeader title={`${p.initials} · ${oneLiner(p)}`} subtitle={`Patient ${idx + 1} of ${patients.length}`}
        right={<View style={st.nav}>
          <Pressable onPress={() => go(-1)} disabled={idx === 0} hitSlop={8} style={[st.navBtn, idx === 0 && { opacity: 0.3 }]} accessibilityLabel="Previous patient"><Icon name="back" size={20} /></Pressable>
          <Pressable onPress={() => go(1)} disabled={idx === patients.length - 1} hitSlop={8} style={[st.navBtn, idx === patients.length - 1 && { opacity: 0.3 }]} accessibilityLabel="Next patient"><Icon name="chevron" size={20} /></Pressable>
        </View>} />
      <ScrollView contentContainerStyle={st.content}>
        <Block title="Overnight / subjective" lines={[hp.subjective, ...rosLines(hp)]} />
        <Block title="Vitals" lines={[vitalsLine(hp.vitals)]} />
        <Block title="Exam" lines={examLines(hp)} />
        <Block title="Labs" lines={labLines(hp)} />
        <Block title="Imaging" lines={imagingLines(hp)} />
        <Block title="Daily" lines={dailyLines(hp)} />
        <Block title="Assessment & plan" lines={(hp.ap ?? '').split('\n')} />
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: S.lg, paddingBottom: 80 },
  block:   { marginBottom: S.xl },
  title:   { ...T.label, marginBottom: S.sm },
  line:    { fontSize: 21, lineHeight: 30, color: C.ink, ...T.num },
  header:  { fontWeight: '700', marginTop: S.sm },
  nav:     { flexDirection: 'row', gap: 4 },
  navBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
