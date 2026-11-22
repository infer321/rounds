/** Antibiotic day counting. Day 1 = the start day (calendar days, local time). */
const DAY = 86_400_000;

export const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function abxDay(start: number, now = Date.now()): number {
  return Math.round((startOfDay(now) - startOfDay(start)) / DAY) + 1;
}

/** Start date for a course that is on `day` today (e.g. "already on day 3"). */
export function startForDay(day: number, now = Date.now()): number {
  return startOfDay(now) - (Math.max(1, day) - 1) * DAY;
}
