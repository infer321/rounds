/** A/P box with "Yesterday" (the plan as it stood at the last Complete round). */
import { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Patient } from '../../data/patients';
import { usePatients } from '../../context/PatientsContext';
import APInput from '../APInput';
import Sheet from '../Sheet';
import { Section, SmallBtn } from './Section';
import { C, T, S } from '../../theme';

export default function APSection({ patient, onCenter }: { patient: Patient; onCenter: (v: View | null) => void }) {
  const { patchHP } = usePatients();
  const ref = useRef<View>(null);
  const [showPrev, setShowPrev] = useState(false);
  const hp = patient.hp ?? {};
  const prev = [...(hp.history ?? [])].reverse().find(h => h.ap?.trim());
  const when = prev ? new Date(prev.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

  return (
    <Section title="Assessment & plan" action={prev && <SmallBtn label="Yesterday" icon="undo" onPress={() => setShowPrev(true)} />}>
      <View ref={ref}>
        <APInput value={hp.ap ?? ''} onChange={v => patchHP(patient.id, { ap: v })} hp={hp}
          placeholder={'# Problem\n- plan\n\nType .aki, .chf… for templates'} onFocused={() => onCenter(ref.current)} />
      </View>
      <Text style={st.hint}>A/P carries forward each day. Edit, don't retype.</Text>
      <Sheet visible={showPrev} onClose={() => setShowPrev(false)} title="Previous plan" subtitle={when}>
        <ScrollView style={{ maxHeight: 420 }}><Text style={st.prev} selectable>{prev?.ap}</Text></ScrollView>
      </Sheet>
    </Section>
  );
}

const st = StyleSheet.create({
  hint: { ...T.caption, color: C.ink4, marginTop: 6, fontWeight: '400' },
  prev: { ...T.body, lineHeight: 21, paddingBottom: S.lg },
});
