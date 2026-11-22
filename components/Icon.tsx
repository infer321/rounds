/**
 * Minimal stroke icon set (24px grid, 1.75 stroke). Replaces unicode glyphs
 * (← ✕ ✓ ⚙ ▦), which render inconsistently across fonts and read as placeholder UI.
 */
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { C } from '../theme';

export type IconName =
  | 'back' | 'plus' | 'close' | 'check' | 'gear' | 'grid' | 'handoff' | 'copy'
  | 'minus' | 'lock' | 'chevron' | 'clock' | 'flag' | 'trend' | 'trash' | 'undo' | 'edit';

export default function Icon({ name, size = 20, color = C.ink, strokeWidth = 1.75 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back'    && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'plus'    && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'minus'   && <Path d="M5 12h14" {...p} />}
      {name === 'close'   && <Path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === 'check'   && <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {name === 'grid'    && <>
        <Rect x="4" y="4" width="7" height="7" rx="1.5" {...p} />
        <Rect x="13" y="4" width="7" height="7" rx="1.5" {...p} />
        <Rect x="4" y="13" width="7" height="7" rx="1.5" {...p} />
        <Rect x="13" y="13" width="7" height="7" rx="1.5" {...p} />
      </>}
      {name === 'handoff' && <>
        <Path d="M8 6h11M8 12h11M8 18h11" {...p} />
        <Path d="M4 6h.01M4 12h.01M4 18h.01" {...p} strokeWidth={strokeWidth + 1} />
      </>}
      {name === 'gear'    && <>
        <Circle cx="12" cy="12" r="3" {...p} />
        <Path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" {...p} />
      </>}
      {name === 'copy'    && <>
        <Rect x="8" y="8" width="12" height="12" rx="2" {...p} />
        <Path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" {...p} />
      </>}
      {name === 'lock'    && <>
        <Rect x="5" y="11" width="14" height="9" rx="2" {...p} />
        <Path d="M8 11V8a4 4 0 018 0v3" {...p} />
      </>}
      {name === 'clock'   && <>
        <Circle cx="12" cy="12" r="8" {...p} />
        <Path d="M12 8v4l2.5 2" {...p} />
      </>}
      {name === 'flag'    && <Path d="M6 20V5M6 5h10l-2 3.5L16 12H6" {...p} />}
      {name === 'trend'   && <Path d="M4 17l5-5 3 3 7-7M15 8h4v4" {...p} />}
      {name === 'trash'   && <Path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" {...p} />}
      {name === 'undo'    && <Path d="M9 7L5 11l4 4M5 11h9a5 5 0 010 10h-2" {...p} />}
      {name === 'edit'    && <Path d="M5 19h4L19 9l-4-4L5 15v4z" {...p} />}
    </Svg>
  );
}
