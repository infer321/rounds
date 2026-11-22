/**
 * A/P autocomplete. Pure: (text, caret, hp) → chips. Tested in isolation.
 *
 * Triggers, checked in this order, first match wins:
 *   "pe" / "exam" / "physical exam" → documented exam findings
 *   vital prefix (t, hr, rr, bp, o2, sat…) → that vital, with H/L flag
 *   imaging prefix (xr, ct, mri, us, echo, img) → documented studies
 *   lab prefix (n → Na, cr → Cr…) → today's value, with H/L flag
 *   ".xyz" → dot phrases;  "abx" → antibiotics with day count
 */
import { HAndP, Labs } from '../data/patients';
import { EXAM_SECTIONS } from '../data/examSections';
import { LAB_LABEL, labFlag } from './clinical';
import { vitalsLine } from './noteExport';
import { abxDay } from './abx';
import { Phrase, matchPhrases } from './phrases';

import type { Suggestion } from '../context/KeyboardContext';

const LAB_ALIAS: Record<string, keyof Labs> = {
  na: 'na', sodium: 'na', k: 'k', potassium: 'k', cl: 'cl', chloride: 'cl',
  co2: 'co2', bicarb: 'co2', hco3: 'co2', bun: 'bun', cr: 'cr', creatinine: 'cr',
  glu: 'glu', glucose: 'glu', wbc: 'wbc', hgb: 'hgb', hb: 'hgb', hct: 'hct',
  plt: 'plt', plts: 'plt', platelets: 'plt', ca: 'ca', calcium: 'ca',
  po4: 'po4', phos: 'po4', phosphorus: 'po4', tp: 'tp', alb: 'alb', albumin: 'alb',
  ast: 'ast', alt: 'alt', ldh: 'ldh', bili: 'bili', bilirubin: 'bili', tbili: 'bili',
  alp: 'ap', alk: 'ap', alkphos: 'ap', mg: 'mg', magnesium: 'mg',
  pt: 'pt', inr: 'inr', ptt: 'ptt',
};

type VitalTrigger = 'temp' | 'hr' | 'rr' | 'bp' | 'o2';
const VIT_ALIAS: Record<string, VitalTrigger> = {
  t: 'temp', temp: 'temp', temperature: 'temp',
  hr: 'hr', pulse: 'hr', rr: 'rr', resp: 'rr', bp: 'bp',
  o2: 'o2', sat: 'o2', spo2: 'o2', o2sat: 'o2',
};
// Which slice of vitalsLine() each trigger keeps
const VIT_PREFIX: Record<VitalTrigger, string> = { temp: 'T ', hr: 'HR ', rr: 'RR ', bp: 'BP ', o2: 'SpO2' };

const IMG_ALIAS: Record<string, string[]> = {
  xr: ['XR'], xray: ['XR'], cxr: ['XR'], ct: ['CT'], mri: ['MRI'],
  us: ['US'], ultrasound: ['US'], echo: ['US'],
  img: [], imaging: [], rad: [],   // [] = all studies
};

const PE_WORDS = ['pe', 'exam', 'physical exam', 'physical examination'];

function lastWords(before: string) {
  const m = before.match(/(\S+)$/);
  const word = (m?.[1] ?? '').toLowerCase();
  const words = before.trim().split(/\s+/);
  return {
    word,
    start: before.length - (m?.[1].length ?? 0),
    tail2: words.slice(-2).join(' ').toLowerCase(),
  };
}

function examChips(hp: HAndP, from: number): Suggestion[] {
  const f = hp.examFindings ?? {};
  const out: Suggestion[] = [];
  for (const sec of EXAM_SECTIONS) for (const x of sec.findings) {
    const s = f[`${sec.key}_${x.key}`];
    // neg phrases are already negated ("no murmur"), so insert them as-is
    if (s) out.push({ label: s === 'pos' ? `+ ${x.pos}` : x.neg, insert: s === 'pos' ? x.pos : x.neg, replaceFrom: from });
  }
  return out.slice(0, 10);
}

function vitalChips(hp: HAndP, word: string, from: number): Suggestion[] {
  const parts = vitalsLine(hp.vitals).split(' | ').filter(Boolean);
  const kinds = new Set(Object.entries(VIT_ALIAS).filter(([a]) => a.startsWith(word)).map(([, k]) => k));
  return [...kinds]
    .map(k => parts.find(p => p.startsWith(VIT_PREFIX[k])))
    .filter((p): p is string => !!p)
    .map(p => ({ label: p, insert: p, replaceFrom: from }));
}

function imagingChips(hp: HAndP, word: string, from: number): Suggestion[] {
  const studies = hp.imagingStudies ?? [];
  for (const [alias, mods] of Object.entries(IMG_ALIAS)) {
    if (!alias.startsWith(word)) continue;
    const hits = mods.length ? studies.filter(s => mods.includes(s.modality.toUpperCase())) : studies;
    if (hits.length) return hits.slice(0, 8).map(s => {
      const loc = [s.bodyPart, s.laterality].filter(Boolean).join(' ');
      return { label: `${s.modality} ${loc}`, insert: `${s.modality} ${loc}: ${s.findings}`, replaceFrom: from };
    });
  }
  return [];
}

function labChips(hp: HAndP, word: string, from: number): Suggestion[] {
  const labs = hp.labs ?? {};
  const keys = new Set(Object.entries(LAB_ALIAS).filter(([a, k]) => a.startsWith(word) && labs[k]).map(([, k]) => k));
  return [...keys].slice(0, 8).map(k => {
    const f = labFlag(k, labs[k]);
    const txt = `${LAB_LABEL[k]} ${labs[k]}${f ? ` (${f})` : ''}`;
    return { label: txt, insert: txt, replaceFrom: from };
  });
}

function abxChips(hp: HAndP, word: string, from: number): Suggestion[] {
  if (!hp.abx?.length || !('abx'.startsWith(word) || 'antibiotics'.startsWith(word)) || word.length < 2) return [];
  const all = hp.abx.map(a => `${a.name} D${abxDay(a.start)}`);
  return [{ label: all.join(', '), insert: all.join(', '), replaceFrom: from }];
}

export function suggestionsFor(text: string, caret: number, hp: HAndP, phrases: Phrase[] = []): Suggestion[] {
  const { word, start, tail2 } = lastWords(text.slice(0, caret));
  if (!word) return [];
  if (word.startsWith('.')) {
    return matchPhrases(word, phrases).map(p => ({ label: `.${p.trigger}`, insert: p.text, replaceFrom: start }));
  }
  if (PE_WORDS.includes(word) || PE_WORDS.includes(tail2)) {
    const c = examChips(hp, PE_WORDS.includes(tail2) ? caret - tail2.length : start);
    if (c.length) return c;
  }
  for (const chips of [abxChips(hp, word, start), vitalChips(hp, word, start), imagingChips(hp, word, start), labChips(hp, word, start)]) {
    if (chips.length) return chips;
  }
  return [];
}
