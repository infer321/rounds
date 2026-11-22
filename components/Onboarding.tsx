/** First-run walkthrough: three short cards, then start with a demo patient or empty. */
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Sheet, { Btn } from './Sheet';
import Icon, { IconName } from './Icon';
import { tap } from '../utils/haptics';
import { C, T, R, S } from '../theme';

const CARDS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'lock', title: 'Private by design',
    body: 'Patients are initials, age and a one-liner. Everything is encrypted on this phone behind Face ID. No accounts, no server.' },
  { icon: 'clock', title: 'Timers and signout',
    body: 'One-tap timers for repeat labs and results. Flag anything for signout and copy an I-PASS handoff in one tap.' },
  { icon: 'copy', title: 'Notes in seconds',
    body: 'Fill vitals, labs (or paste them from the EMR), exam and plan. Copy a clean H&P, SOAP or eye consult into Teams or the EMR.' },
];

export default function Onboarding({ visible, onDone }: { visible: boolean; onDone: (withDemo: boolean) => void }) {
  const [i, setI] = useState(0);
  const last = i === CARDS.length - 1;
  const c = CARDS[i];
  return (
    <Sheet visible={visible} onClose={() => onDone(false)} title="Welcome to Rounds"
      footer={last
        ? <><Btn label="Start empty" kind="secondary" onPress={() => onDone(false)} /><Btn label="Try a demo patient" onPress={() => onDone(true)} flex={1.4} /></>
        : <Btn label="Next" onPress={() => { tap(); setI(i + 1); }} />}>
      <View style={st.card}>
        <View style={st.badge}><Icon name={c.icon} size={26} /></View>
        <Text style={st.title}>{c.title}</Text>
        <Text style={st.body}>{c.body}</Text>
      </View>
      <View style={st.dots}>
        {CARDS.map((_, n) => (
          <Pressable key={n} onPress={() => setI(n)} hitSlop={8} accessibilityLabel={`Step ${n + 1}`}>
            <View style={[st.dot, n === i && st.dotOn]} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const st = StyleSheet.create({
  card:  { alignItems: 'center', paddingVertical: S.lg, gap: S.md, minHeight: 210 },
  badge: { width: 60, height: 60, borderRadius: R.lg, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  title: { ...T.h2, textAlign: 'center' },
  body:  { ...T.body, color: C.ink2, textAlign: 'center', lineHeight: 22 },
  dots:  { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: C.lineStrong },
  dotOn: { backgroundColor: C.ink, width: 18 },
});
