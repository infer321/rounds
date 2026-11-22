/** A realistic, fake demo patient for first-run onboarding. Clearly labeled DEMO. */
import { Patient } from '../data/patients';
import { uid } from './id';

export function demoPatient(now = Date.now()): Patient {
  return {
    id: uid(), initials: 'DEM', age: '67', gender: 'M', descriptor: 'DEMO: CHF exacerbation', colorIndex: 0, updatedAt: now,
    items: [
      { id: uid(), type: 'timer', label: 'Repeat BMP', endsAt: now + 4 * 3600e3, signout: true },
      { id: uid(), type: 'task', label: 'Call cardiology re: echo', signout: false },
    ],
    ipass: { severity: 'Watcher', summary: 'Diuresing, net -1.2L yesterday', contingency: 'If SBP <90 or Cr up >0.3, hold diuretic and page' },
    hp: {
      hpi: '67M with HFrEF (EF 30%) presenting with 5 days of worsening dyspnea and leg swelling after running out of diuretic.',
      subjective: 'Breathing better. Slept flat with 2 pillows.',
      vitals: { temp: '36.8', hr: '92', rr: '20', bpS: '138', bpD: '84', spo2: '94', o2Mode: 'NC', o2Val: '2' },
      prevVitals: { temp: '37.1', hr: '104', rr: '24', bpS: '152', bpD: '90', spo2: '90' },
      labs: { wbc: '8.1', hgb: '11.2', hct: '34', plt: '210', na: '133', k: '3.4', cl: '96', co2: '28', bun: '32', cr: '1.5', glu: '128' },
      prevLabs: { na: '131', k: '3.9', cr: '1.3', bun: '28' },
      examFindings: { general_distress: 'neg', cv_murmur: 'neg', pulm_crackles: 'pos' },
      examNotes: { ext: '2+ pitting edema to mid-shin' },
      daily: { diet: 'Cardiac', vte: 'Heparin SQ', code: 'Full', lines: 'PIV x2', dispo: 'Home, 1-2 days' },
      abx: [],
      ap: '# Acute on chronic HFrEF\n- IV diuresis, goal net -1 to -2L\n- Daily weights, strict I/Os\n- Replete K, goal >4\n\n# AKI on CKD\n- Likely cardiorenal, trend Cr',
    },
  };
}
