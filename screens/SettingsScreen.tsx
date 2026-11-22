import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { useSettings } from '../context/SettingsContext';
import { tap, warn } from '../utils/haptics';
import Icon from '../components/Icon';
import { C, T, R, S } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

function Row({ title, sub, right, onPress, danger }: { title: string; sub?: string; right?: React.ReactNode; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [st.row, pressed && onPress && { backgroundColor: C.sunken }]}>
      <View style={{ flex: 1 }}>
        <Text style={[T.body, danger && { color: C.high }]}>{title}</Text>
        {!!sub && <Text style={[T.caption, { marginTop: 2, fontWeight: '400' }]}>{sub}</Text>}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={18} color={C.ink4} /> : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { clearAll, patients } = usePatients();
  const { settings, update } = useSettings();

  function newShift() {
    warn();
    Alert.alert('Start new shift?', `Removes all ${patients.length} patients, notes and timers from this phone. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => { clearAll(); navigation.goBack(); } },
    ]);
  }

  const step = (d: number) => {
    const dis = d < 0 ? settings.slotCount <= 1 : settings.slotCount >= 16;
    return (
      <Pressable disabled={dis} onPress={() => { tap(); update({ slotCount: settings.slotCount + d }); }}
        style={[st.step, dis && { opacity: 0.3 }]} hitSlop={6} accessibilityLabel={d < 0 ? 'Fewer slots' : 'More slots'}>
        <Icon name={d < 0 ? 'minus' : 'plus'} size={14} strokeWidth={2.25} />
      </Pressable>
    );
  };
  const stepper = (
    <View style={st.stepper}>
      {step(-1)}
      <Text style={st.stepVal}>{settings.slotCount}</Text>
      {step(1)}
    </View>
  );

  return (
    <View style={[st.screen, { paddingTop: insets.top + S.sm }]}>
      <StatusBar style="dark" />
      <View style={st.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={st.iconBtn}><Icon name="back" size={22} /></Pressable>
        <Text style={T.h2}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.sec}>List</Text>
        <View style={st.card}>
          <Row title="Census slots" sub="Empty cards shown on the patient grid" right={stepper} />
          <View style={st.div} />
          <Row title="Timer presets" sub="Add, rename or remove one-tap timers" onPress={() => navigation.navigate('Presets')} />
        </View>

        <Text style={st.sec}>Privacy</Text>
        <View style={st.card}>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={T.body}>Auto-lock</Text>
              <Text style={[T.caption, { marginTop: 2, fontWeight: '400' }]}>Require Face ID after leaving the app for</Text>
            </View>
          </View>
          <View style={st.segWrap}>
            <View style={st.seg}>
              {[[0, 'Immediately'], [1, '1 min'], [5, '5 min']].map(([v, l]) => {
                const on = settings.autoLockMin === v;
                return (
                  <Pressable key={v} style={[st.segBtn, on && st.segOn]} onPress={() => { tap(); update({ autoLockMin: v as number }); }}>
                    <Text style={[T.small, { color: on ? C.ink : C.ink3, fontWeight: on ? '600' : '400' }]}>{l}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={st.div} />
          <Row title="Initials in notifications" sub="Off: lock screen shows only the timer label"
            right={<Switch value={settings.notifShowInitials} onValueChange={v => update({ notifShowInitials: v })} trackColor={{ true: C.ink }} />} />
        </View>
        <Text style={st.foot}>
          Patient data is AES-256 encrypted on this phone. The key lives in the device keychain and is never synced or uploaded. The app has no server.
        </Text>

        <Text style={st.sec}>Shift</Text>
        <View style={st.card}>
          <Row title="Start new shift" sub="Clear every patient from this phone" onPress={newShift} danger />
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md, marginBottom: S.md },
  iconBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content:{ paddingHorizontal: S.lg, paddingBottom: 60 },
  sec:    { ...T.label, marginTop: S.xl, marginBottom: S.sm, marginLeft: 4 },
  card:   { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.line, overflow: 'hidden' },
  row:    { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 14 },
  div:    { height: 0.5, backgroundColor: C.line, marginLeft: S.lg },
  stepper:{ flexDirection: 'row', alignItems: 'center', gap: S.md },
  step:   { width: 30, height: 30, borderRadius: 15, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' },
  stepVal:{ ...T.bodyM, ...T.num, minWidth: 20, textAlign: 'center' },
  segWrap:{ paddingHorizontal: S.lg, paddingBottom: 14 },
  seg:    { flexDirection: 'row', backgroundColor: C.sunken, borderRadius: R.sm + 2, padding: 2 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: R.sm },
  segOn:  { backgroundColor: C.surface },
  foot:   { ...T.caption, fontWeight: '400', color: C.ink3, marginTop: S.sm, marginHorizontal: 4, lineHeight: 17 },
});
