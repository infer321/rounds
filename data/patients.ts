export type ItemType = 'timer' | 'task';

export type Vitals = {
  temp?: string; rr?: string; hr?: string;
  bpS?: string; bpD?: string;
  o2Mode?: 'RA' | 'NC' | 'BiPAP';
  o2Val?: string;
  spo2?: string;
};

export type Labs = {
  // CBC
  wbc?: string; hgb?: string; hct?: string; plt?: string;
  // BMP
  na?: string; k?: string; cl?: string; co2?: string;
  bun?: string; cr?: string; glu?: string;
  // LFT / CMP
  ca?: string; po4?: string; tp?: string; alb?: string;
  ast?: string; alt?: string; ldh?: string; ap?: string; bili?: string;
  // Coags + Mg
  pt?: string; inr?: string; ptt?: string; mg?: string;
};

export type PanelKey = 'vitals' | 'cbc' | 'bmp' | 'lft' | 'coag';

/** One archived set of values. Written by "Advance" / "Complete round". */
export type Snapshot = {
  at: number;                 // epoch ms
  vitals?: Vitals;
  labs?: Labs;
  ap?: string;                // A/P as it stood when the round was completed
  subjective?: string;
};

/** Daily checklist. Values carry forward day to day. */
export type Daily = {
  diet?: string;
  vte?: string;
  code?: string;
  lines?: string;
  dispo?: string;
};

/** Antibiotic course; day count is derived from the start date. */
export type Abx = { id: string; name: string; start: number /* local midnight, epoch ms */ };

export type EyePair = { od?: string; os?: string };
export type EyeExam = {
  reason?: string;
  vaMethod?: 'cc' | 'sc';
  va?: EyePair;
  ph?: EyePair;               // pinhole
  iopMethod?: 'Tonopen' | 'iCare' | 'Applanation';
  iop?: EyePair;
  pupils?: EyePair;
  apd?: 'None' | 'OD' | 'OS';
  eom?: EyePair;
  cvf?: EyePair;
  ll?: EyePair; cs?: EyePair; k?: EyePair; ac?: EyePair; iris?: EyePair; lens?: EyePair;
  dilated?: boolean;
  disc?: EyePair; mac?: EyePair; vessels?: EyePair; periph?: EyePair;
};

export type Severity = 'Stable' | 'Watcher' | 'Unstable';
/** I-PASS handoff fields (Illness severity, Patient summary, Action list, Situation awareness). */
export type IPass = { severity?: Severity; summary?: string; contingency?: string };

export type ImagingStudy = {
  id: string;
  modality: string;    // 'XR' | 'CT' | 'MRI' | 'US'
  bodyPart: string;
  laterality?: string;
  findings: string;
};

export type HAndP = {
  hpi?: string;
  course?: string;
  subjective?: string;       // SOAP S
  vitals?: Vitals;
  prevVitals?: Vitals;
  labs?: Labs;
  prevLabs?: Labs;
  otherLabs?: string;        // free-text: lactate, trop, BNP, cultures…
  history?: Snapshot[];      // newest last, capped (see MAX_HISTORY)
  imagingStudies?: ImagingStudy[];
  ap?: string;
  examFindings?: Record<string, 'pos' | 'neg'>;
  examNotes?: Record<string, string>;
  peNote?: string;
  rosFindings?: Record<string, 'pos' | 'neg'>;
  rosNote?: string;
  daily?: Daily;
  abx?: Abx[];
  eye?: EyeExam;
  // legacy, kept so old saves still load
  pe?: string;
  diagnostics?: string;
};

export const MAX_HISTORY = 14;

export type Item = {
  id: string;
  type: ItemType;
  label: string;
  endsAt?: number;
  notificationId?: string;
  signout?: boolean;
  handedOff?: boolean;       // checked off on the signout list (item is kept)
  urgent?: boolean;
};

export type Patient = {
  id: string;
  initials: string;
  age?: string;
  gender?: string;
  descriptor?: string;
  colorIndex: number;        // legacy, unused in UI
  items: Item[];
  hp?: HAndP;
  ipass?: IPass;
  updatedAt?: number;        // last edit (drives the stale-patient reminder)
};
