/**
 * Paste-to-fill: pull lab values out of text copied from the EMR.
 * Handles one result per line in the common shapes:
 *   "Sodium 134 (L)"   "NA: 134 mmol/L"   "Creatinine   1.82 H   0.60-1.20"
 *   "WBC 12.1 x10^3/uL"   "Bilirubin, Total 0.8"   "INR 1.25"
 * The first number after the lab name is taken as the value.
 */
import { Labs } from '../data/patients';
import { LabKey } from './clinical';

// Longest names first so "prothrombin time" beats "pt", "bilirubin, total" beats "bilirubin"
const NAMES: [string, LabKey][] = ([
  ['white blood cell', 'wbc'], ['white blood cells', 'wbc'], ['wbc', 'wbc'], ['leukocytes', 'wbc'],
  ['hemoglobin', 'hgb'], ['hgb', 'hgb'], ['hb', 'hgb'],
  ['hematocrit', 'hct'], ['hct', 'hct'],
  ['platelet count', 'plt'], ['platelets', 'plt'], ['platelet', 'plt'], ['plt', 'plt'],
  ['sodium', 'na'], ['na', 'na'],
  ['potassium', 'k'], ['k', 'k'],
  ['chloride', 'cl'], ['cl', 'cl'],
  ['carbon dioxide', 'co2'], ['bicarbonate', 'co2'], ['hco3', 'co2'], ['co2', 'co2'], ['tco2', 'co2'],
  ['blood urea nitrogen', 'bun'], ['urea nitrogen', 'bun'], ['bun', 'bun'],
  ['creatinine', 'cr'], ['creat', 'cr'], ['cr', 'cr'],
  ['glucose', 'glu'], ['glu', 'glu'],
  ['calcium', 'ca'], ['ca', 'ca'],
  ['phosphorus', 'po4'], ['phosphate', 'po4'], ['phos', 'po4'], ['po4', 'po4'],
  ['protein, total', 'tp'], ['total protein', 'tp'], ['protein total', 'tp'], ['tp', 'tp'],
  ['albumin', 'alb'], ['alb', 'alb'],
  ['aspartate aminotransferase', 'ast'], ['ast', 'ast'], ['sgot', 'ast'],
  ['alanine aminotransferase', 'alt'], ['alt', 'alt'], ['sgpt', 'alt'],
  ['lactate dehydrogenase', 'ldh'], ['ldh', 'ldh'],
  ['alkaline phosphatase', 'ap'], ['alk phos', 'ap'], ['alp', 'ap'],
  ['bilirubin, total', 'bili'], ['bilirubin total', 'bili'], ['total bilirubin', 'bili'], ['t bili', 'bili'], ['tbili', 'bili'], ['bilirubin', 'bili'],
  ['magnesium', 'mg'], ['mg', 'mg'],
  ['prothrombin time', 'pt'], ['pt', 'pt'], ['protime', 'pt'],
  ['inr', 'inr'],
  ['partial thromboplastin time', 'ptt'], ['aptt', 'ptt'], ['ptt', 'ptt'],
] as [string, LabKey][]).sort((a, b) => b[0].length - a[0].length);

const NUM = /(?:^|[\s:=])(<|>)?\s*(\d+(?:\.\d+)?)/;

export type ParseResult = { labs: Labs; count: number };

export function parseLabs(text: string): ParseResult {
  const labs: Labs = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/\t+/g, ' ');
    if (!line) continue;
    const lower = line.toLowerCase();
    const hit = NAMES.find(([name]) => lower.startsWith(name) && !/[a-z]/.test(lower.charAt(name.length)));
    if (!hit) continue;
    const [name, key] = hit;
    if (labs[key]) continue;                       // keep the first (most recent) result
    const m = line.slice(name.length).match(NUM);
    if (!m) continue;
    labs[key] = (m[1] ?? '') + m[2];
  }
  // Drop "<" / ">" qualifiers the numeric cells can't hold, but keep the number
  for (const k of Object.keys(labs) as LabKey[]) labs[k] = labs[k]!.replace(/^[<>]/, '');
  return { labs, count: Object.keys(labs).length };
}
