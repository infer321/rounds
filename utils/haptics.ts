import * as Haptics from 'expo-haptics';

/** Thin wrappers so call sites stay one word and failures never throw. */
export const tap     = () => Haptics.selectionAsync().catch(() => {});
export const thud    = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const warn    = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
