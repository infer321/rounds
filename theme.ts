/**
 * Design tokens. Every color, size and radius in the app comes from here.
 * Direction: quiet, paper-like, clinical. One ink color does the work;
 * color is reserved for meaning (high / low / due / flagged).
 */
import { Platform } from 'react-native';

export const C = {
  bg:        '#F4F4F1',  // page
  surface:   '#FFFFFF',  // cards, inputs
  sunken:    '#ECECE8',  // pressed / segmented track
  line:      '#E2E2DC',  // hairlines
  lineStrong:'#CFCFC8',

  ink:       '#17181B',  // primary text, primary buttons
  ink2:      '#4A4C52',  // secondary text
  ink3:      '#8A8C92',  // tertiary / labels
  ink4:      '#B9BAB5',  // placeholder / disabled

  // Meaning
  high:      '#C0352B',  // above range, overdue, destructive
  highBg:    '#FBECEA',
  low:       '#1F5FA8',  // below range
  lowBg:     '#EAF1FA',
  ok:        '#2F7A4F',  // normal / denies / done
  okBg:      '#EAF4EE',
  flag:      '#A86410',  // signout flag
  flagBg:    '#FBF1E2',
  timer:     '#17181B',
};

export const T = {
  // Type scale (system font: SF Pro / Roboto)
  title:   { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4, color: C.ink },
  h2:      { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, color: C.ink },
  body:    { fontSize: 15, fontWeight: '400' as const, color: C.ink },
  bodyM:   { fontSize: 15, fontWeight: '500' as const, color: C.ink },
  small:   { fontSize: 13, fontWeight: '400' as const, color: C.ink2 },
  caption: { fontSize: 12, fontWeight: '500' as const, color: C.ink3 },
  label:   { fontSize: 11, fontWeight: '600' as const, color: C.ink3, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  num:     { fontVariant: ['tabular-nums' as const] },
  mono:    { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const R = { sm: 8, md: 12, lg: 16, pill: 999 };
export const HAIR = 0.5;
