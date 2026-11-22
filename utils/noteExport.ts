/**
 * Plain-text note builder for "Copy H&P / Copy SOAP / Copy signout".
 * Output is plain ASCII-ish text that survives Teams → Cerner paste:
 * no markdown, no tabs, H/L tags instead of color.
 */
import { EyeExam, EyePair, HAndP, Labs, Patient, Vitals } from '../data/patients';
import { abxDay } from './abx';
import { EXAM_SECTIONS } from '../data/examSections';
import { ROS_SECTIONS } from '../data/rosSections';
import { LAB_LABEL, LabKey, PANELS, labFlag, vitFlag, VitKey, flagOf, IOP_RANGE } from './clinical';

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

export function dailyLines(hp: HAndP, now = Date.now()): string[] {
  const d = hp.daily ?? {};
  const out: string[] = [];
  const first = [d.diet && `Diet: ${d.diet}`, d.vte && `VTE ppx: ${d.vte}`, d.code && `Code: ${d.code}`].filter(Boolean);
  if (first.length) out.push(first.join(' | '));
  if (d.lines?.trim()) out.push(`Lines/drains: ${d.lines.trim()}`);
  if (hp.abx?.length) out.push(`Abx: ${hp.abx.map(a => `${a.name} D${abxDay(a.start, now)}`).join(', ')}`);
  if (d.dispo?.trim()) out.push(`Dispo: ${d.dispo.trim()}`);
  return out;
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
    block('Daily', dailyLines(hp)),
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
    block('Daily', dailyLines(hp)),
    block('A/P', hp.ap),
  ].filter(Boolean).join('\n\n');
}

function clock(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours(); const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ap}`;
}

/** I-PASS signout for the whole list: severity, summary, action list, if/then. */
export function buildSignout(patients: Patient[], now = Date.now()): string {
  if (!patients.length) return '';
  const d = new Date(now);
  const header = `Signout (I-PASS) ${d.getMonth() + 1}/${d.getDate()} ${clock(now)}`;
  const body = patients.map((p, n) => {
    const ip = p.ipass ?? {};
    const lines = [`${n + 1}) ${p.initials} ${oneLiner(p)}${ip.severity ? ` [${ip.severity}]` : ''}`];
    if (ip.summary?.trim()) lines.push(`   Summary: ${ip.summary.trim()}`);
    const todo = p.items.filter(i => i.signout);
    if (todo.length) {
      lines.push('   To do:');
      todo.forEach(i => {
        const due = i.type === 'timer' && i.endsAt ? (i.endsAt <= now ? ' (overdue)' : ` (due ${clock(i.endsAt)})`) : '';
        lines.push(`   - ${i.label}${due}`);
      });
    }
    if (ip.contingency?.trim()) lines.push(`   If/then: ${ip.contingency.trim()}`);
    return lines.join('\n');
  });
  return [header, ...body].join('\n\n');
}

// ── Ophthalmology consult ────────────────────────────────────────────────

/** "20/20 OU" when both eyes match, else "OD 20/25 | OS 20/40". */
export function pair(p?: EyePair, fmt: (v: string) => string = v => v): string | undefined {
  const od = p?.od?.trim(), os = p?.os?.trim();
  if (!od && !os) return undefined;
  if (od && od === os) return `${fmt(od)} OU`;
  return [od && `OD ${fmt(od)}`, os && `OS ${fmt(os)}`].filter(Boolean).join(' | ');
}

const iopFmt = (v: string) => `${v}${tag(flagOf(v, IOP_RANGE))}`;

export function eyeExamLines(e: EyeExam = {}): string[] {
  const row = (label: string, v?: string) => (v ? `${label}: ${v}` : undefined);
  const out = [
    row(`VA ${e.vaMethod ?? 'cc'}`, pair(e.va)),
    row('Pinhole', pair(e.ph)),
    row(`IOP${e.iopMethod ? ` (${e.iopMethod})` : ''}`, pair(e.iop, iopFmt)),
    row('Pupils', [pair(e.pupils), e.apd && (e.apd === 'None' ? 'no APD' : `APD ${e.apd}`)].filter(Boolean).join(', ') || undefined),
    row('EOM', pair(e.eom)),
    row('CVF', pair(e.cvf)),
  ].filter(Boolean) as string[];
  const sle = [['L/L', e.ll], ['C/S', e.cs], ['K', e.k], ['AC', e.ac], ['Iris', e.iris], ['Lens', e.lens]] as const;
  const sleLines = sle.map(([l, v]) => row(`  ${l}`, pair(v))).filter(Boolean) as string[];
  if (sleLines.length) out.push('SLE', ...sleLines);
  const dfe = [['Disc', e.disc], ['Macula', e.mac], ['Vessels', e.vessels], ['Periphery', e.periph]] as const;
  const dfeLines = dfe.map(([l, v]) => row(`  ${l}`, pair(v))).filter(Boolean) as string[];
  if (dfeLines.length) out.push(e.dilated === false ? 'Fundus (undilated)' : 'DFE', ...dfeLines);
  return out;
}

export function buildEyeConsult(p: Patient): string {
  const hp = p.hp ?? {};
  return [
    `Ophthalmology consult: ${oneLiner(p)}`,
    block('Reason for consult', hp.eye?.reason),
    block('HPI', hp.hpi),
    block('Exam', eyeExamLines(hp.eye)),
    block('Assessment & Plan', hp.ap),
  ].filter(Boolean).join('\n\n');
}
