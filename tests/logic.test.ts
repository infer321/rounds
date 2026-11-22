/**
 * Logic tests. Run: npm test
 * Pure functions only (no React Native), so they run in plain Node.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHP, buildSOAP, buildSignout, buildEyeConsult, pair } from '../utils/noteExport';
import { advanceHP } from '../utils/rounds';
import { suggestionsFor } from '../utils/apSuggestions';
import { parseLabs } from '../utils/labParse';
import { abxDay, startForDay } from '../utils/abx';
import { BUILT_IN_PHRASES, matchPhrases } from '../utils/phrases';
import { HAndP, Patient } from '../data/patients';

const DAY = 86_400_000;
const hp: HAndP = {
  hpi: '67M w/ HFrEF p/w 3d DOE.',
  subjective: 'No overnight events',
  vitals: { temp: '38.4', hr: '112', rr: '18', bpS: '150', bpD: '95', spo2: '91', o2Mode: 'NC', o2Val: '2' },
  prevVitals: { temp: '37.1', hr: '98' },
  labs: { wbc: '14.2', hgb: '9.8', na: '134', k: '4.1', cr: '1.8', inr: '1.25', bun: '120', ast: '3400' },
  prevLabs: { cr: '1.4' },
  otherLabs: 'BNP 1840',
  examFindings: { general_distress: 'neg', pulm_crackles: 'pos', cv_murmur: 'neg' },
  examNotes: { ext: '2+ pitting edema to knees' },
  rosFindings: { constitutional_fever: 'pos', constitutional_chills: 'neg' },
  imagingStudies: [{ id: 'x', modality: 'CT', bodyPart: 'Head', findings: 'no bleed' }],
  daily: { diet: 'Cardiac', vte: 'Heparin SQ', code: 'Full', lines: 'PIV x2', dispo: 'Home 1-2d' },
  abx: [{ id: 'a', name: 'Ceftriaxone', start: startForDay(3) }],
  ap: '# Acute on chronic HFrEF\n- IV lasix',
  eye: {
    reason: 'Blurry vision', vaMethod: 'cc', va: { od: '20/25', os: '20/40' }, iop: { od: '15', os: '28' }, iopMethod: 'Tonopen',
    pupils: { od: '3→2', os: '3→2' }, apd: 'None', eom: { od: 'Full', os: 'Full' },
    k: { od: 'Clear', os: 'Clear' }, dilated: true, disc: { od: '0.3 sharp', os: '0.5 sharp' },
  },
};
const p: Patient = {
  id: '1', initials: 'JM', age: '67', gender: 'M', descriptor: 'CHF exacerbation', colorIndex: 0, hp,
  ipass: { severity: 'Watcher', summary: 'Diuresing, net -1L', contingency: 'If SBP <90, hold lasix' },
  items: [
    { id: 'a', type: 'timer', label: 'Repeat K', endsAt: Date.now() + 3600e3, signout: true },
    { id: 'b', type: 'task', label: 'Not on signout' },
  ],
};

test('H&P: flags, trends, extremes, ROS, exam, daily', () => {
  const t = buildHP(p);
  for (const s of ['T 38.4 (H)', 'SpO2 91% (L) 2L NC', 'Cr 1.8 (H) (prev 1.4)', 'BUN 120 (H)', 'AST 3400 (H)', 'INR 1.25 (H)',
    'Reports: fever', 'Denies: chills', 'Pulm: crackles', 'Ext: 2+ pitting edema', 'Diet: Cardiac | VTE ppx: Heparin SQ | Code: Full',
    'Abx: Ceftriaxone D3', 'Dispo: Home 1-2d']) assert.ok(t.includes(s), s);
  assert.ok(!t.includes('JM'), 'no initials in notes');
});

test('SOAP structure', () => {
  const t = buildSOAP(p);
  assert.ok(t.startsWith('Progress note: 67M CHF exacerbation'));
  assert.ok(t.includes('O:\nVitals:'));
  assert.ok(t.indexOf('Daily:') < t.indexOf('A/P:'));
});

test('I-PASS signout covers every patient', () => {
  const q: Patient = { id: '2', initials: 'AB', age: '40', gender: 'F', colorIndex: 0, items: [] };
  const t = buildSignout([p, q]);
  assert.ok(t.includes('1) JM 67M CHF exacerbation [Watcher]'));
  assert.ok(t.includes('Summary: Diuresing') && t.includes('If/then: If SBP <90'));
  assert.ok(t.includes('- Repeat K (due') && !t.includes('Not on signout'));
  assert.ok(t.includes('2) AB 40F'));
});

test('Eye consult', () => {
  const t = buildEyeConsult(p);
  for (const s of ['Reason for consult:\nBlurry vision', 'VA cc: OD 20/25 | OS 20/40', 'IOP (Tonopen): OD 15 | OS 28 (H)',
    'Pupils: 3→2 OU, no APD', 'EOM: Full OU', 'SLE\n  K: Clear OU', 'DFE\n  Disc: OD 0.3 sharp | OS 0.5 sharp']) assert.ok(t.includes(s), s);
  assert.equal(pair({}), undefined);
});

test('advance: one panel, whole round, cap', () => {
  const a1 = advanceHP(hp, ['bmp']);
  assert.equal(a1.labs!.cr, undefined); assert.equal(a1.prevLabs!.cr, '1.8'); assert.equal(a1.labs!.wbc, '14.2');
  assert.equal(a1.history!.length, 1);
  const a2 = advanceHP(a1, ['vitals', 'cbc', 'bmp', 'lft', 'coag'], true);
  assert.deepEqual(a2.vitals, {}); assert.equal(a2.prevVitals!.temp, '38.4');
  assert.equal(a2.subjective, undefined, 'subjective cleared');
  assert.equal(a2.ap, hp.ap, 'A/P carries forward');
  assert.equal(a2.history!.at(-1)!.ap, hp.ap, 'A/P archived');
  let h: HAndP = hp; for (let i = 0; i < 20; i++) h = advanceHP({ ...h, labs: { na: String(130 + i) } }, ['bmp']);
  assert.equal(h.history!.length, 14);
});

test('A/P suggestions', () => {
  const at = (t: string) => suggestionsFor(t, t.length, hp, BUILT_IN_PHRASES);
  assert.ok(at('# AKI\n- cr').some(s => s.insert === 'Cr 1.8 (H)'));
  assert.equal(at('fever t')[0].insert, 'T 38.4 (H)');
  assert.equal(at('bp')[0].insert, 'BP 150/95 (H)');
  const pe = at('pe');
  assert.ok(pe.some(s => s.insert === 'no murmur') && !pe.some(s => s.insert.startsWith('no no')));
  assert.equal(at('ct')[0].insert, 'CT Head: no bleed');
  assert.equal(at('.ak')[0].insert.split('\n')[0], '# AKI');
  assert.equal(at('abx')[0].insert, 'Ceftriaxone D3');
  assert.equal(at('xyz').length, 0);
});

test('lab paste parser', () => {
  const { labs, count } = parseLabs([
    'Sodium 134 (L)', 'Potassium\t4.1', 'Chloride: 99 mmol/L', 'CO2 22', 'BUN 120 H', 'Creatinine   1.82 H   0.60-1.20',
    'Glucose 142', 'WBC 12.1 x10^3/uL', 'Hemoglobin 9.8 L', 'Hematocrit 30.1', 'Platelet Count 210',
    'Bilirubin, Total 0.8', 'Alkaline Phosphatase 160 H', 'AST (SGOT) 45', 'INR 1.25', 'PT 14.2', 'PTT 31', 'Magnesium 1.9',
    'Troponin <0.01', 'Patient name should never parse 99',
  ].join('\n'));
  assert.deepEqual(labs, { na: '134', k: '4.1', cl: '99', co2: '22', bun: '120', cr: '1.82', glu: '142', wbc: '12.1', hgb: '9.8',
    hct: '30.1', plt: '210', bili: '0.8', ap: '160', ast: '45', inr: '1.25', pt: '14.2', ptt: '31', mg: '1.9' });
  assert.equal(count, 18);
  assert.equal(parseLabs('PT 14.2\nPTT 31').labs.pt, '14.2', 'PT vs PTT');
});

test('abx day counting', () => {
  const now = new Date(2026, 10, 21, 9).getTime();
  assert.equal(abxDay(now, now), 1);
  assert.equal(abxDay(startForDay(5, now), now), 5);
  assert.equal(abxDay(now - 2 * DAY, now + 3 * 3600e3), 3);
});

test('phrase matching', () => {
  assert.equal(matchPhrases('.c', BUILT_IN_PHRASES).map(p => p.trigger).join(), 'cp,chf,copd');
  assert.equal(matchPhrases('.zz', BUILT_IN_PHRASES).length, 0);
});
