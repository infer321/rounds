/**
 * Design tokens. Every color, size and radius in the app comes from here.
 * Direction: quiet, paper-like, clinical. One ink color does the work;
 * color is reserved for meaning (high / low / due / flagged).
 */
import { ColorValue, DynamicColorIOS, Platform, useColorScheme } from 'react-native';

/**
 * Light + dark palettes. On iOS each token is a DynamicColorIOS, so every
 * StyleSheet follows the appearance automatically (System / Light / Dark in
 * Settings). Android stays light.
 * SVG can't take dynamic colors: SVG drawings call useColor() to get a hex.
 */
const LIGHT = {
  bg: '#F4F4F1', surface: '#FFFFFF', sunken: '#ECECE8', line: '#E2E2DC', lineStrong: '#CFCFC8',
  ink: '#17181B', ink2: '#4A4C52', ink3: '#8A8C92', ink4: '#B9BAB5',
  onInk: '#FFFFFF',          // text/icons on an ink-filled button
  high: '#C0352B', highBg: '#FBECEA', low: '#1F5FA8', lowBg: '#EAF1FA',
  ok: '#2F7A4F', okBg: '#EAF4EE', flag: '#A86410', flagBg: '#FBF1E2',
  timer: '#17181B', shadow: '#000000',
  highFaded: '#D9A19C', lowFaded: '#97B4D6', highLine: '#EDC2BD', okLine: '#BFDCCB',
  kbBar: '#D3D5DA', kbChipBar: '#E8EBEF', kbLine: '#C0C5CC', kbKeyLine: '#C5C9D0',
};

const DARK: typeof LIGHT = {
  bg: '#0E0F11', surface: '#1A1B1E', sunken: '#26282C', line: '#2C2E33', lineStrong: '#3B3E44',
  ink: '#ECECE8', ink2: '#B8BAB5', ink3: '#86888D', ink4: '#56585D',
  onInk: '#121315',
  high: '#F0675B', highBg: '#3A1C1A', low: '#6FA8EC', lowBg: '#16263A',
  ok: '#5DBB86', okBg: '#15291E', flag: '#E3A24A', flagBg: '#33260F',
  timer: '#ECECE8', shadow: '#000000',
  highFaded: '#8A4C47', lowFaded: '#41618A', highLine: '#5A2B27', okLine: '#24493A',
  kbBar: '#2C2C2E', kbChipBar: '#1F1F21', kbLine: '#3A3A3C', kbKeyLine: '#48484A',
};

type Token = keyof typeof LIGHT;
const pairs = new Map<unknown, [string, string]>();

function dyn(light: string, dark: string): ColorValue {
  const v = Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;
  if (Platform.OS === 'ios') pairs.set(v, [light, dark]);
  return v;
}

export const C = Object.fromEntries(
  (Object.keys(LIGHT) as Token[]).map(k => [k, dyn(LIGHT[k], DARK[k])]),
) as Record<Token, ColorValue>;

/** Hex for a theme color in the current appearance (for SVG). Plain strings pass through. */
export function useColor() {
  const scheme = useColorScheme();
  return (c: ColorValue): string => {
    const p = pairs.get(c);
    if (!p) return c as string;
    return scheme === 'dark' ? p[1] : p[0];
  };
}

/** Raw palette for places that need strings (navigation theme). */
export const palette = (scheme: 'light' | 'dark' | null | undefined) =>
  (Platform.OS === 'ios' && scheme === 'dark' ? DARK : LIGHT);

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
