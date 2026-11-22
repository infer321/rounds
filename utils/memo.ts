import { memo, ComponentType } from 'react';

/**
 * React.memo that ignores function props and compares arrays by element.
 * Safe here because every callback we pass down (patchHP, navigation, refs)
 * uses functional state updates, so an older closure still writes correctly.
 * Keeps heavy note blocks (SVG fishbones, vitals grid) from re-rendering
 * while you type in a different field.
 */
export function memoData<P extends object>(C: ComponentType<P>) {
  return memo(C, (a: Readonly<P>, b: Readonly<P>) => {
    const ra = a as Record<string, unknown>, rb = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(ra), ...Object.keys(rb)]);
    for (const k of keys) {
      const x = ra[k], y = rb[k];
      if (typeof x === 'function' && typeof y === 'function') continue;
      if (Array.isArray(x) && Array.isArray(y)) {
        if (x.length !== y.length || x.some((v, i) => v !== y[i])) return false;
        continue;
      }
      if (x !== y) return false;
    }
    return true;
  });
}
