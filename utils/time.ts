import { Item } from '../data/patients';

export function sortItemsByUrgency(items: Item[], now: number): Item[] {
  return [...items].sort((a, b) => {
    const score = (item: Item) => {
      if (item.type === 'timer' && item.endsAt) {
        const diff = item.endsAt - now;
        return diff <= 0 ? diff - 1_000_000_000 : diff; // overdue sorts first (most negative), then soonest
      }
      return 1_000_000_000; // tasks after all timers
    };
    return score(a) - score(b);
  });
}

export function parseDurationMs(str: string): number {
  let ms = 0;
  const h = str.match(/(\d+)\s*h/);
  const m = str.match(/(\d+)\s*m/);
  const s = str.match(/(\d+)\s*s/);
  if (h) ms += parseInt(h[1]) * 3_600_000;
  if (m) ms += parseInt(m[1]) * 60_000;
  if (s) ms += parseInt(s[1]) * 1_000;
  return ms;
}

export type CountdownResult = {
  display: string;
  isOverdue: boolean;
  isUrgent: boolean;
};

export function formatCountdown(endsAt: number, now: number): CountdownResult {
  const diff = endsAt - now;
  if (diff <= 0) {
    const over = Math.floor(-diff / 60_000);
    const display = over < 1 ? 'Due now' : over < 60 ? `${over}m over` : `${Math.floor(over / 60)}h ${over % 60}m over`;
    return { display, isOverdue: true, isUrgent: true };
  }

  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const isUrgent = diff < 5 * 60_000;

  if (h >= 48) return { display: `${Math.floor(h / 24)}d ${h % 24}h`, isOverdue: false, isUrgent: false };
  if (h > 0)   return { display: `${h}h ${m}m`, isOverdue: false, isUrgent };
  if (m > 0)   return { display: `${m}m ${s}s`, isOverdue: false, isUrgent };
  return { display: `${s}s`, isOverdue: false, isUrgent: true };
}

/** "1h 30m" → { h: 1, m: 30 } (for the duration wheel). */
export function toHM(str?: string): { h: number; m: number } {
  const h = str?.match(/(\d+)\s*h/), m = str?.match(/(\d+)\s*m/);
  return { h: h ? parseInt(h[1]) : 0, m: m ? parseInt(m[1]) : 0 };
}

/** { 1, 30 } → "1h 30m" */
export const hmStr = (h: number, m: number) => (h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`);

/** Minutes left on a timer, rounded to the wheel's 5-minute steps. */
export function remainingHM(endsAt?: number, now = Date.now()): { h: number; m: number } {
  const min = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 60_000)) : 0;
  return { h: Math.floor(min / 60), m: (Math.round((min % 60) / 5) * 5) % 60 };
}

/** Add minutes to an h/m pair, keeping minutes on the 5-minute grid, capped at 72h. */
export function addMinutes({ h, m }: { h: number; m: number }, add: number) {
  const total = Math.min(72 * 60, h * 60 + m + add);
  return { h: Math.floor(total / 60), m: total % 60 - ((total % 60) % 5) };
}
