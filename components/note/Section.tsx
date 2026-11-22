import { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon, { IconName } from '../Icon';
import { C, T, R, S } from '../../theme';

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={st.section}>
      <View style={st.secHead}>
        <Text style={T.label}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function SmallBtn({ label, onPress, icon, disabled }: { label: string; onPress: () => void; icon?: IconName; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8}
      style={({ pressed }) => [st.smallBtn, pressed && { backgroundColor: C.sunken }, disabled && { opacity: 0.35 }]}>
      {icon && <Icon name={icon} size={14} color={C.ink2} strokeWidth={2} />}
      <Text style={st.smallBtnText}>{label}</Text>
    </Pressable>
  );
}


const st = StyleSheet.create({
  section: { marginTop: S.xl },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm, minHeight: 24 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, borderWidth: 0.5, borderColor: C.lineStrong, backgroundColor: C.surface },
  smallBtnText: { ...T.caption, color: C.ink2 },
});
