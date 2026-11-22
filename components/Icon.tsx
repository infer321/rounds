/**
 * Minimal stroke icon set, data-driven (24px grid, 1.75 stroke). Replaces unicode glyphs
 * (← ✕ ✓ ⚙ ▦), which render inconsistently across fonts and read as placeholder UI.
 */
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ColorValue } from 'react-native';
import { C, useColor } from '../theme';

export type IconName =
  | 'back' | 'plus' | 'close' | 'check' | 'gear' | 'grid' | 'handoff' | 'copy'
  | 'minus' | 'lock' | 'chevron' | 'clock' | 'flag' | 'trend' | 'trash' | 'undo' | 'edit' | 'up' | 'down' | 'paste' | 'present' | 'eye';

type Shape = { d: string } | { circle: [number, number, number] } | { rect: [number, number, number, number] };
const p = (d: string): Shape => ({ d });
const rect = (x: number, y: number, w: number, h: number): Shape => ({ rect: [x, y, w, h] });

const SHAPES: Record<IconName, Shape[]> = {
  back:    [p('M15 5l-7 7 7 7')],
  chevron: [p('M9 5l7 7-7 7')],
  plus:    [p('M12 5v14M5 12h14')],
  minus:   [p('M5 12h14')],
  close:   [p('M6 6l12 12M18 6L6 18')],
  check:   [p('M5 12.5l4.5 4.5L19 7.5')],
  grid:    [rect(4, 4, 7, 7), rect(13, 4, 7, 7), rect(4, 13, 7, 7), rect(13, 13, 7, 7)],
  handoff: [p('M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01')],
  gear:    [{ circle: [12, 12, 3] }, p('M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8')],
  copy:    [rect(8, 8, 12, 12), p('M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2')],
  lock:    [rect(5, 11, 14, 9), p('M8 11V8a4 4 0 018 0v3')],
  clock:   [{ circle: [12, 12, 8] }, p('M12 8v4l2.5 2')],
  flag:    [p('M6 20V5M6 5h10l-2 3.5L16 12H6')],
  trend:   [p('M4 17l5-5 3 3 7-7M15 8h4v4')],
  trash:   [p('M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12')],
  undo:    [p('M9 7L5 11l4 4M5 11h9a5 5 0 010 10h-2')],
  edit:    [p('M5 19h4L19 9l-4-4L5 15v4z')],
  up:      [p('M6 15l6-6 6 6')],
  down:    [p('M6 9l6 6 6-6')],
  paste:   [rect(6, 5, 12, 16), p('M9 5V3.5h6V5M9 11h6M9 15h4')],
  present: [p('M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4')],
  eye:     [p('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z'), { circle: [12, 12, 3] }],
};

export default function Icon({ name, size = 20, color = C.ink, strokeWidth = 1.75 }: {
  name: IconName; size?: number; color?: ColorValue; strokeWidth?: number;
}) {
  const hex = useColor();
  const stroke = { stroke: hex(color), strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {SHAPES[name].map((s, i) =>
        'd' in s ? <Path key={i} d={s.d} {...stroke} />
        : 'circle' in s ? <Circle key={i} cx={s.circle[0]} cy={s.circle[1]} r={s.circle[2]} {...stroke} />
        : <Rect key={i} x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} rx={1.5} {...stroke} />)}
    </Svg>
  );
}
