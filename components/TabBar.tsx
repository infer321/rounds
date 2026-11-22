import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../App';
import { usePatients } from '../context/PatientsContext';
import Icon, { IconName } from './Icon';
import { C, T, S } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TabBar({ active }: { active: 'patients' | 'signout' | 'settings' }) {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { patients } = usePatients();
  const pending = patients.reduce((n, p) => n + p.items.filter(i => i.signout && !i.handedOff).length, 0);

  const tabs: { key: typeof active; label: string; icon: IconName; go: () => void; badge?: number }[] = [
    { key: 'patients', label: 'Patients', icon: 'grid', go: () => navigation.navigate('Home') },
    { key: 'signout', label: 'Signout', icon: 'handoff', go: () => navigation.navigate('Signout'), badge: pending },
    { key: 'settings', label: 'Settings', icon: 'gear', go: () => navigation.navigate('Settings') },
  ];

  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, S.sm) }]}>
      {tabs.map(t => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} style={st.tab} onPress={on ? undefined : t.go} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <View>
              <Icon name={t.icon} size={22} color={on ? C.ink : C.ink3} strokeWidth={on ? 2 : 1.75} />
              {!!t.badge && <View style={st.badge}><Text style={st.badgeText}>{t.badge}</Text></View>}
            </View>
            <Text style={[st.label, on && { color: C.ink, fontWeight: '600' }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.line, backgroundColor: C.surface, paddingTop: S.sm },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { ...T.caption, fontSize: 11, color: C.ink3 },
  badge: { position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.flag, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
