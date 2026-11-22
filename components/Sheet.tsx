/** Bottom sheet used by every modal form. One look, one behavior. */
import { ReactNode } from 'react';
import { Modal, View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { C, T, R, S } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function Sheet({ visible, onClose, title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={st.outer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={st.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[st.sheet, { paddingBottom: Math.max(insets.bottom, S.lg) }]}>
          <View style={st.grab} />
          <View style={st.head}>
            <View style={{ flex: 1 }}>
              <Text style={T.h2}>{title}</Text>
              {!!subtitle && <Text style={[T.small, { marginTop: 2 }]} numberOfLines={1}>{subtitle}</Text>}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={st.close}><Icon name="close" size={18} color={C.ink2} /></Pressable>
          </View>
          {children}
          {footer && <View style={st.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Btn({ label, onPress, kind = 'primary', disabled, flex = 1, testID }: {
  label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; flex?: number; testID?: string;
}) {
  const bg = kind === 'primary' ? C.ink : kind === 'danger' ? C.high : C.surface;
  return (
    <Pressable onPress={onPress} disabled={disabled} testID={testID} accessibilityRole="button"
      style={({ pressed }) => [st.btn, { flex, backgroundColor: bg }, kind === 'secondary' && st.btnSecondary, pressed && { opacity: 0.85 }, disabled && { opacity: 0.35 }]}>
      <Text style={[T.bodyM, { color: kind === 'secondary' ? C.ink : C.onInk }]}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  outer:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,20,22,0.35)' },
  sheet:   { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: S.lg, maxHeight: '92%' },
  grab:    { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: C.lineStrong, marginTop: S.sm, marginBottom: S.md },
  head:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.lg },
  close:   { width: 30, height: 30, borderRadius: 15, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' },
  footer:  { flexDirection: 'row', gap: S.sm, marginTop: S.lg },
  btn:     { paddingVertical: 14, borderRadius: R.md, alignItems: 'center' },
  btnSecondary: { borderWidth: 0.5, borderColor: C.lineStrong },
});
