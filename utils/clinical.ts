/**
 * Single source of truth for reference ranges, labels and panel membership.
 * Ranges are general adult inpatient defaults; they drive color + H/L flags only.
 */
import { Labs, Vitals, PanelKey } from '../data/patients';

export type LabKey = keyof Labs;
export type VitKey = 'temp' | 'rr' | 'hr' | 'bpS' | 'bpD' | 'spo2';

export const LAB_RANGES: Record<LabKey, [number, number]> = {
  wbc: [4.5, 11.0], hgb: [12.0, 17.5], hct: [36, 52], plt: [150, 400],
  na: [136, 145], k: [3.5, 5.0], cl: [98, 106], co2: [22, 29],
  bun: [7, 20], cr: [0.6, 1.2], glu: [70, 140],
  ca: [8.5, 10.5], po4: [2.5, 4.5], tp: [6.0, 8.3], alb: [3.5, 5.0],
  ast: [10, 40], alt: [7, 56], ldh: [140, 280], ap: [44, 147], bili: [0.1, 1.2],
  pt: [11, 13.5], inr: [0.8, 1.2], ptt: [25, 35], mg: [1.7, 2.2],
};

/** Max characters per lab cell. Sized so real extremes fit (BUN 120, AST 3400, Plt 1200). */
export const LAB_MAXLEN: Record<LabKey, number> = {
  wbc: 5, hgb: 4, hct: 4, plt: 4,
  na: 3, k: 4, cl: 3, co2: 3, bun: 3, cr: 5, glu: 4,
  ca: 4, po4: 4, tp: 4, alb: 4, ast: 5, alt: 5, ldh: 5, ap: 5, bili: 4,
  pt: 5, inr: 4, ptt: 5, mg: 4,
};

export const LAB_LABEL: Record<LabKey, string> = {
  wbc: 'WBC', hgb: 'Hgb', hct: 'Hct', plt: 'Plt',
  na: 'Na', k: 'K', cl: 'Cl', co2: 'HCO3', bun: 'BUN', cr: 'Cr', glu: 'Glu',
  ca: 'Ca', po4: 'Phos', tp: 'TP', alb: 'Alb', ast: 'AST', alt: 'ALT', ldh: 'LDH', ap: 'ALP', bili: 'Tbili',
  pt: 'PT', inr: 'INR', ptt: 'PTT', mg: 'Mg',
};

export const VIT_RANGES: Record<VitKey, [number, number]> = {
  temp: [36.0, 38.0], rr: [12, 20], hr: [60, 100], bpS: [90, 140], bpD: [60, 90], spo2: [92, 100],
};

/** IOP (mmHg): above 21 flags high; below 6 flags hypotony. */
export const IOP_RANGE: [number, number] = [6, 21];

export const PANELS: Record<Exclude<PanelKey, 'vitals'>, LabKey[]> = {
  cbc:  ['wbc', 'hgb', 'hct', 'plt'],
  bmp:  ['na', 'k', 'cl', 'co2', 'bun', 'cr', 'glu'],
  lft:  ['ca', 'po4', 'tp', 'alb', 'ast', 'alt', 'ldh', 'ap', 'bili'],
  coag: ['mg', 'pt', 'inr', 'ptt'],
};

export const PANEL_LABEL: Record<PanelKey, string> = {
  vitals: 'Vitals', cbc: 'CBC', bmp: 'BMP', lft: 'CMP / LFT', coag: 'Mg / Coags',
};

/** Tab order through every lab cell. */
export const LAB_ORDER: LabKey[] = [...PANELS.cbc, ...PANELS.bmp, ...PANELS.lft, ...PANELS.coag];

export type Flag = 'H' | 'L' | null;

export function flagOf(val: string | undefined, range: [number, number]): Flag {
  if (!val) return null;
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  if (n > range[1]) return 'H';
  if (n < range[0]) return 'L';
  return null;
}

export const labFlag = (k: LabKey, v?: string) => flagOf(v, LAB_RANGES[k]);
export const vitFlag = (k: VitKey, v?: string) => flagOf(v, VIT_RANGES[k]);

/** Accept digits with up to 2 decimals (Cr 0.85, INR 1.25). */
export const NUMERIC_RE = /^\d*\.?\d{0,2}$/;

export function hasAny(obj?: object): boolean {
  return !!obj && Object.values(obj).some(v => v !== undefined && v !== '');
}

export function ageSex(age?: string, gender?: string): string {
  return [age, gender].filter(Boolean).join('');
}

export function vitalsHasData(v?: Vitals): boolean {
  return !!v && (hasAny({ ...v, o2Mode: undefined }) || !!v.o2Mode);
}
