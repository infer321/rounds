/**
 * One-line toast at the bottom of the screen, optionally with Undo.
 * Destructive actions (remove item, remove patient, clear exam) use this
 * instead of a confirm dialog: fast by default, recoverable on a slip.
 */
import { createContext, useContext, useRef, useState, ReactNode, useCallback } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, T, R, S } from '../theme';

type ToastArgs = { message: string; onUndo?: () => void; ms?: number };
const Ctx = createContext<(t: ToastArgs) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastArgs | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const show = useCallback((t: ToastArgs) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast(t);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(hide, t.ms ?? (t.onUndo ? 4500 : 2000));
  }, [anim, hide]);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[st.wrap, { bottom: insets.bottom + 72, opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
        >
          <View style={st.toast}>
            <Text style={st.msg} numberOfLines={2}>{toast.message}</Text>
            {toast.onUndo && (
              <Pressable hitSlop={10} onPress={() => { toast.onUndo?.(); hide(); }}>
                <Text style={st.undo}>Undo</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const st = StyleSheet.create({
  wrap:  { position: 'absolute', left: S.lg, right: S.lg, alignItems: 'center', zIndex: 9000 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: S.lg, backgroundColor: C.ink, borderRadius: R.md, paddingHorizontal: S.lg, paddingVertical: 12, maxWidth: 480, alignSelf: 'stretch' },
  msg:   { ...T.small, color: '#fff', flex: 1 },
  undo:  { ...T.bodyM, color: '#fff', textDecorationLine: 'underline' },
});
