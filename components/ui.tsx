/**
 * Shared building blocks. Every screen header, segmented control, text field
 * and card comes from here so they look and behave the same everywhere.
 */
import { ReactNode, forwardRef } from 'react';
import { View, Text, Pressable, TextInput, TextInputProps, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from './Icon';
import { tap } from '../utils/haptics';
import { C, T, R, S } from '../theme';

/** Full-screen page: background, safe-area top, status bar. */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ui.screen, { paddingTop: insets.top + S.sm }]}>
      <StatusBar style="auto" />
      {children}
    </View>
  );
}

/** Back arrow + title (+ optional subtitle and right-side action). */
export function ScreenHeader({ title, subtitle, right, onTitlePress, leading }: {
  title: string; subtitle?: string; right?: ReactNode; onTitlePress?: () => void; leading?: ReactNode;
}) {
  const navigation = useNavigation();
  const titleBlock = (
    <View style={{ flex: 1 }}>
      <Text style={T.h2} numberOfLines={1}>{title}</Text>
      {!!subtitle && <Text style={T.caption} numberOfLines={1}>{subtitle}</Text>}
    </View>
  );
  return (
    <View style={ui.header}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={ui.iconBtn} accessibilityLabel="Back">
        <Icon name="back" size={22} />
      </Pressable>
      {onTitlePress ? (
        <Pressable onPress={onTitlePress} style={({ pressed }) => [ui.titleRow, pressed && { opacity: 0.6 }]}>
          {leading}{titleBlock}
        </Pressable>
      ) : <View style={ui.titleRow}>{leading}{titleBlock}</View>}
      {right}
    </View>
  );
}

/** iOS-style segmented control. Pass `allowNone` to let a tap on the active option clear it. */
export function Segmented<V extends string | number>({ options, value, onChange, allowNone, size = 'md', style }: {
  options: readonly (readonly [V, string])[];
  value: V | undefined;
  onChange: (v: V | undefined) => void;
  allowNone?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[ui.seg, style]}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <Pressable key={String(v)} hitSlop={4} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={[size === 'sm' ? ui.segBtnSm : ui.segBtn, on && ui.segOn]}
            onPress={() => { tap(); onChange(on && allowNone ? undefined : v); }}>
            <Text style={[size === 'sm' ? T.caption : T.bodyM, { color: on ? C.ink : C.ink3 }, on && { fontWeight: '600' }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Standard single-line text field. */
export const Field = forwardRef<TextInput, TextInputProps>(function Field({ style, ...props }, ref) {
  return <TextInput ref={ref} placeholderTextColor={C.ink4} {...props} style={[ui.field, style]} />;
});

/** Hairline-bordered surface. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <View style={ui.empty}>
      <Text style={T.h2}>{title}</Text>
      <Text style={[T.small, { textAlign: 'center', marginTop: 6, lineHeight: 20 }]}>{body}</Text>
      {action && <View style={{ alignSelf: 'stretch', marginTop: S.xl }}>{action}</View>}
    </View>
  );
}

export const ui = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md, paddingRight: S.lg, marginBottom: S.md },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  titleRow:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md },
  seg:     { flexDirection: 'row', backgroundColor: C.sunken, borderRadius: R.md, padding: 3 },
  segBtn:  { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  segBtnSm:{ alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  segOn:   { backgroundColor: C.surface, shadowColor: C.shadow, shadowOpacity: 0.07, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  field:   { ...T.body, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: S.md + 2, paddingVertical: 13 },
  card:    { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.line, overflow: 'hidden' },
  empty:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xxl, paddingBottom: 80 },
});
