/**
 * Plain-text note builder for "Copy H&P / Copy SOAP / Copy signout".
 * Output is plain ASCII-ish text that survives Teams → Cerner paste:
 * no markdown, no tabs, H/L tags instead of color.
 */
import { HAndP, Labs, Patient, Vitals } from '../data/patients';
import { EXAM_SECTIONS } from '../data/examSections';
import { ROS_SECTIONS } from '../data/rosSections';
import { LAB_LABEL, LabKey, PANELS, labFlag, vitFlag, VitKey } from './clinical';

const tag = (f: 'H' | 'L' | null) => (f ? ` (${f})` : '');
const join = (parts: (string | undefined | false | null)[], sep = ' | ') => parts.filter(Boolean).join(sep);

export function oneLiner(p: Pick<Patient, 'age' | 'gender' | 'descriptor'>): string {
  const as = [p.age, p.gender].filter(Boolean).join('');
  return [as, p.descriptor].filter(Boolean).join(' ') || 'Patient';
}

function vit(k: VitKey, label: string, v?: string, unit = '') {
  return v ? `${label} ${v}${unit}${tag(vitFlag(k, v))}` : undefined;
}

export function vitalsLine(v?: Vitals): string {
  if (!v) return '';
  const bp = v.bpS || v.bpD
    ? `BP ${v.bpS ?? '?'}/${v.bpD ?? '?'}${tag(vitFlag('bpS', v.bpS) ?? vitFlag('bpD', v.bpD))}`
    : undefined;
  let o2: string | undefined;
  if (v.spo2 || v.o2Mode) {
    const support = v.o2Mode === 'NC' ? `${v.o2Val ? v.o2Val + 'L ' : ''}NC`
      : v.o2Mode === 'BiPAP' ? `BiPAP${v.o2Val ? ' ' + v.o2Val : ''}`
      : v.o2Mode === 'RA' ? 'RA' : '';
    o2 = join([v.spo2 ? `SpO2 ${v.spo2}%${tag(vitFlag('spo2', v.spo2))}` : 'SpO2', support], ' ');
  }
  return join([vit('temp', 'T', v.temp), vit('hr', 'HR', v.hr), vit('rr', 'RR', v.rr), bp, o2]);
}

function labItem(k: LabKey, labs: Labs, prev?: Labs): string | undefined {
  const v = labs[k];
  if (!v) return undefined;
  const p = prev?.[k];
  return `${LAB_LABEL[k]} ${v}${tag(labFlag(k, v))}${p && p !== v ? ` (prev ${p})` : ''}`;
}

export function labLines(hp: HAndP): string[] {
  const labs = hp.labs ?? {};
  const out: string[] = [];
  const row = (name: string, keys: LabKey[]) => {
    const items = keys.map(k => labItem(k, labs, hp.prevLabs)).filter(Boolean);
    if (items.length) out.push(`${name}: ${items.join(', ')}`);
  };
  row('CBC', PANELS.cbc);
  row('BMP', PANELS.bmp);
  row('CMP/LFT', PANELS.lft);
  row('Mg/Coags', PANELS.coag);
  if (hp.otherLabs?.trim()) out.push(`Other: ${hp.otherLabs.trim()}`);
  return out;
}

export function examLines(hp: HAndP): string[] {
  const f = hp.examFindings ?? {};
  const notes = hp.examNotes ?? {};
  const out: string[] = [];
  EXAM_SECTIONS.forEach(sec => {
    const pos: string[] = [], neg: string[] = [];
    sec.findings.forEach(x => {
      const s = f[`${sec.key}_${x.key}`];
      if (s === 'pos') pos.push(x.pos);
      if (s === 'neg') neg.push(x.neg);
    });
    const note = notes[sec.key]?.trim();
    const parts = [...pos, ...neg, note].filter(Boolean);
    if (parts.length) out.push(`${sec.label}: ${parts.join(', ')}`);
  });
  if (hp.peNote?.trim()) out.push(hp.peNote.trim());
  return out;
}

export function rosLines(hp: HAndP): string[] {
  const f = hp.rosFindings ?? {};
  const pos: string[] = [], neg: string[] = [];
  ROS_SECTIONS.forEach(sec => sec.findings.forEach(x => {
    const s = f[`${sec.key}_${x.key}`];
    if (s === 'pos') pos.push(x.pos);
    if (s === 'neg') neg.push(x.pos); // "Denies fever", not "Denies no fever"
  }));
  const out: string[] = [];
  if (pos.length) out.push(`Reports: ${pos.join(', ')}`);
  if (neg.length) out.push(`Denies: ${neg.join(', ')}`);
  if (hp.rosNote?.trim()) out.push(hp.rosNote.trim());
  return out;
}

export function imagingLines(hp: HAndP): string[] {
  return (hp.imagingStudies ?? []).map(s => {
    const where = [s.bodyPart, s.laterality].filter(Boolean).join(', ');
    return `${s.modality} ${where}: ${s.findings?.trim() || 'pending'}`;
  });
}

function block(title: string, body: string | string[] | undefined): string {
  const lines = Array.isArray(body) ? body : (body ?? '').trim() ? [(body ?? '').trim()] : [];
  return lines.length ? `${title}:\n${lines.join('\n')}` : '';
}

function objective(hp: HAndP): string[] {
  const v = vitalsLine(hp.vitals);
  const pv = vitalsLine(hp.prevVitals);
  return [
    block('Vitals', v ? (pv ? [v, `Prev: ${pv}`] : [v]) : undefined),
    block('Exam', examLines(hp)),
    block('Labs', labLines(hp)),
    block('Imaging', imagingLines(hp)),
  ];
}

export function buildHP(p: Patient): string {
  const hp = p.hp ?? {};
  return [
    `H&P: ${oneLiner(p)}`,
    block('HPI', hp.hpi),
    block('ROS', rosLines(hp)),
    block('Hospital course', hp.course),
    ...objective(hp),
    block('Assessment & Plan', hp.ap),
  ].filter(Boolean).join('\n\n');
}

export function buildSOAP(p: Patient): string {
  const hp = p.hp ?? {};
  const s = [hp.subjective?.trim(), ...rosLines(hp)].filter(Boolean) as string[];
  const o = objective(hp).filter(Boolean);
  return [
    `Progress note: ${oneLiner(p)}`,
    block('S', s),
    o.length ? `O:\n${o.join('\n\n')}` : '',
    block('A/P', hp.ap),
  ].filter(Boolean).join('\n\n');
}

function clock(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours(); const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ap}`;
}

export function buildSignout(patients: Patient[], now = Date.now()): string {
  const groups = patients
    .map(p => ({ p, items: p.items.filter(i => i.signout) }))
    .filter(g => g.items.length);
  if (!groups.length) return '';
  const d = new Date(now);
  const header = `Signout ${d.getMonth() + 1}/${d.getDate()} ${clock(now)}`;
  const body = groups.map(({ p, items }, n) => {
    const lines = items.map(i => {
      const due = i.type === 'timer' && i.endsAt
        ? (i.endsAt <= now ? ' (overdue)' : ` (due ${clock(i.endsAt)})`) : '';
      return `   - ${i.label}${due}`;
    });
    return `${n + 1}) ${p.initials} ${oneLiner(p)}\n${lines.join('\n')}`;
  });
  return [header, ...body].join('\n\n');
}
