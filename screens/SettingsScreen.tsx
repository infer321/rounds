import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import { useSettings } from '../context/SettingsContext';
import { tap, warn } from '../utils/haptics';
import Icon from '../components/Icon';
import { Screen, ScreenHeader, Segmented, ui } from '../components/ui';
import { C, T, S } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const LOCK_OPTIONS = [[0, 'Immediately'], [1, '1 min'], [5, '5 min']] as const;
const LOOK_OPTIONS = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']] as const;
const STALE_OPTIONS = [[0, 'Off'], [2, '2 days'], [3, '3 days'], [7, '7 days']] as const;

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
    <Screen>
      <ScreenHeader title="Settings" />

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.sec}>List</Text>
        <View style={ui.card}>
          <Row title="Census slots" sub="Empty cards shown on the patient grid" right={stepper} />
          <View style={st.div} />
          <Row title="Timer presets" sub="Add, rename or remove one-tap timers" onPress={() => navigation.navigate('Presets')} />
          <View style={st.div} />
          <Row title="Phrases" sub="Dot-phrase templates for the A/P (.aki, .chf…)" onPress={() => navigation.navigate('Phrases')} />
        </View>

        <Text style={st.sec}>Appearance</Text>
        <View style={ui.card}>
          <View style={[st.segWrap, { paddingTop: 14 }]}>
            <Segmented options={LOOK_OPTIONS} value={settings.appearance} onChange={v => v && update({ appearance: v })} size="sm" />
          </View>
        </View>

        <Text style={st.sec}>Privacy</Text>
        <View style={ui.card}>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={T.body}>Auto-lock</Text>
              <Text style={[T.caption, { marginTop: 2, fontWeight: '400' }]}>Require Face ID after leaving the app for</Text>
            </View>
          </View>
          <View style={st.segWrap}>
            <Segmented options={LOCK_OPTIONS} value={settings.autoLockMin} onChange={v => v !== undefined && update({ autoLockMin: v })} size="sm" />
          </View>
          <View style={st.div} />
          <Row title="Initials in notifications" sub="Off: lock screen shows only the timer label"
            right={<Switch value={settings.notifShowInitials} onValueChange={v => update({ notifShowInitials: v })} trackColor={{ true: C.ink }} />} />
          <View style={st.div} />
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={T.body}>Old-patient reminder</Text>
              <Text style={[T.caption, { marginTop: 2, fontWeight: '400' }]}>Suggest clearing patients not edited for</Text>
            </View>
          </View>
          <View style={st.segWrap}>
            <Segmented options={STALE_OPTIONS} value={settings.staleDays} onChange={v => v !== undefined && update({ staleDays: v })} size="sm" />
          </View>
        </View>
        <Text style={st.foot}>
          Patient data is AES-256 encrypted on this phone. The key lives in the device keychain and is never synced or uploaded. The app has no server.
        </Text>

        <Text style={st.sec}>Shift</Text>
        <View style={ui.card}>
          <Row title="Show the walkthrough again" onPress={() => { update({ onboarded: false }); navigation.goBack(); }} />
          <View style={st.div} />
          <Row title="Start new shift" sub="Clear every patient from this phone" onPress={newShift} danger />
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  content:{ paddingHorizontal: S.lg, paddingBottom: 60 },
  sec:    { ...T.label, marginTop: S.xl, marginBottom: S.sm, marginLeft: 4 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 14 },
  div:    { height: 0.5, backgroundColor: C.line, marginLeft: S.lg },
  stepper:{ flexDirection: 'row', alignItems: 'center', gap: S.md },
  step:   { width: 30, height: 30, borderRadius: 15, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' },
  stepVal:{ ...T.bodyM, ...T.num, minWidth: 20, textAlign: 'center' },
  segWrap:{ paddingHorizontal: S.lg, paddingBottom: 14 },
  foot:   { ...T.caption, fontWeight: '400', color: C.ink3, marginTop: S.sm, marginHorizontal: 4, lineHeight: 17 },
});
