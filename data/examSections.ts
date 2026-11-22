export type ExamFindingDef = {
  key: string;
  short: string;  // label shown in null (non-contributory) state
  pos: string;    // pertinent positive text
  neg: string;    // pertinent negative text
};

export type ExamSectionDef = {
  key: string;
  label: string;
  always: boolean;   // false = sensitive section, hidden behind toggle
  findings: ExamFindingDef[];
};

export const EXAM_SECTIONS: ExamSectionDef[] = [
  {
    key: 'general', label: 'General', always: true,
    findings: [
      { key: 'illAppearing',   short: 'Appearance',   pos: 'ill appearing',              neg: 'well appearing' },
      { key: 'distress',       short: 'Distress',     pos: 'in acute distress',          neg: 'in no acute distress' },
      { key: 'disoriented',    short: 'Orientation',  pos: 'disoriented',                neg: 'oriented ×3' },
      { key: 'gaitDifficulty', short: 'Gait',         pos: 'ambulating with difficulty', neg: 'ambulating without difficulty' },
    ],
  },
  {
    key: 'skin', label: 'Skin', always: true,
    findings: [
      { key: 'rash',       short: 'Rash',     pos: 'rash present',      neg: 'no rash' },
      { key: 'bruising',   short: 'Bruising', pos: 'unusual bruising',  neg: 'no unusual bruising' },
      { key: 'poorTurgor', short: 'Turgor',   pos: 'poor skin turgor',  neg: 'good turgor' },
    ],
  },
  {
    key: 'heent', label: 'HEENT', always: true,
    findings: [
      { key: 'headTrauma',            short: 'Head',       pos: 'head trauma',             neg: 'normocephalic, atraumatic' },
      { key: 'conjunctivalInjection', short: 'Conjunctiva',pos: 'conjunctival injection',  neg: 'conjunctiva clear' },
      { key: 'scleralIcterus',        short: 'Sclera',     pos: 'scleral icterus',         neg: 'sclera non-icteric' },
      { key: 'dryMucousMembranes',    short: 'MM',         pos: 'dry mucous membranes',    neg: 'mucous membranes moist' },
      { key: 'pharyngealExudate',     short: 'Pharynx',    pos: 'pharyngeal exudate',      neg: 'no pharyngeal exudate' },
      { key: 'cervicalLAD',           short: 'Neck LN',    pos: 'cervical LAD',            neg: 'no cervical LAD' },
    ],
  },
  {
    key: 'cv', label: 'CV', always: true,
    findings: [
      { key: 'murmur',          short: 'Murmur', pos: 'murmur',           neg: 'no murmur' },
      { key: 'irregularRhythm', short: 'Rhythm', pos: 'irregular rhythm', neg: 'regular rate and rhythm' },
      { key: 'gallop',          short: 'Gallop', pos: 'gallop',           neg: 'no gallop' },
    ],
  },
  {
    key: 'pulm', label: 'Pulm', always: true,
    findings: [
      { key: 'wheezes',                short: 'Wheeze',  pos: 'wheezes',             neg: 'no wheezes' },
      { key: 'crackles',               short: 'Crackles',pos: 'crackles',            neg: 'no crackles' },
      { key: 'rhonchi',                short: 'Rhonchi', pos: 'rhonchi',             neg: 'no rhonchi' },
      { key: 'increasedWorkBreathing', short: 'WOB',     pos: '↑ work of breathing', neg: 'work of breathing normal' },
    ],
  },
  {
    key: 'abd', label: 'Abd', always: true,
    findings: [
      { key: 'tenderness', short: 'Tender',    pos: 'tenderness', neg: 'non-tender' },
      { key: 'distention', short: 'Distended', pos: 'distension', neg: 'non-distended' },
      { key: 'mass',       short: 'Mass',      pos: 'mass',       neg: 'no masses' },
      { key: 'guarding',   short: 'Guarding',  pos: 'guarding',   neg: 'no guarding' },
    ],
  },
  {
    key: 'back', label: 'Back', always: true,
    findings: [
      { key: 'cvaTenderness',    short: 'CVA',   pos: 'CVA tenderness',    neg: 'no CVA tenderness' },
      { key: 'spinalTenderness', short: 'Spine', pos: 'spinal tenderness', neg: 'no spinal tenderness' },
    ],
  },
  {
    key: 'ext', label: 'Ext', always: true,
    findings: [
      { key: 'edema',     short: 'Edema',     pos: 'edema',      neg: 'no edema' },
      { key: 'cyanosis',  short: 'Cyanosis',  pos: 'cyanosis',   neg: 'no cyanosis' },
      { key: 'deformity', short: 'Deformity', pos: 'deformity',  neg: 'no deformity' },
    ],
  },
  {
    key: 'msk', label: 'MSK', always: true,
    findings: [
      { key: 'tenderness',   short: 'Tender',   pos: 'tenderness', neg: 'no tenderness' },
      { key: 'decreasedRom', short: 'ROM',      pos: '↓ ROM',      neg: 'normal ROM' },
      { key: 'weakness',     short: 'Strength', pos: 'weakness',   neg: 'no weakness' },
      { key: 'swelling',     short: 'Swelling', pos: 'swelling',   neg: 'no swelling' },
    ],
  },
  {
    key: 'neuro', label: 'Neuro', always: true,
    findings: [
      { key: 'focalDeficit',   short: 'Focal',     pos: 'focal deficit',   neg: 'no focal deficits' },
      { key: 'sensoryDeficit', short: 'Sensation', pos: 'sensory deficit', neg: 'sensation intact' },
      { key: 'weakness',       short: 'Strength',  pos: 'weakness',        neg: 'strength intact' },
      { key: 'abnormalGait',   short: 'Gait',      pos: 'abnormal gait',   neg: 'gait normal' },
    ],
  },
  {
    key: 'psych', label: 'Psych', always: true,
    findings: [
      { key: 'flatAffect',       short: 'Affect',   pos: 'flat affect',       neg: 'normal affect' },
      { key: 'anxious',          short: 'Anxiety',  pos: 'anxious',           neg: 'not anxious' },
      { key: 'depressedMood',    short: 'Mood',     pos: 'depressed mood',    neg: 'normal mood' },
      { key: 'impairedJudgment', short: 'Judgment', pos: 'impaired judgment', neg: 'judgment intact' },
    ],
  },
  // ── Sensitive (hidden by default) ──────────────────────────
  {
    key: 'pelvic', label: 'Pelvic', always: false,
    findings: [
      { key: 'lesion',            short: 'Lesion',   pos: 'lesion',             neg: 'no lesions' },
      { key: 'discharge',         short: 'Discharge',pos: 'discharge',          neg: 'no discharge' },
      { key: 'adnexalTenderness', short: 'Adnexa',   pos: 'adnexal tenderness', neg: 'no adnexal tenderness' },
      { key: 'mass',              short: 'Mass',     pos: 'pelvic mass',        neg: 'no pelvic masses' },
    ],
  },
  {
    key: 'breast', label: 'Breast', always: false,
    findings: [
      { key: 'mass',               short: 'Mass',      pos: 'mass',                neg: 'no masses' },
      { key: 'tenderness',         short: 'Tender',    pos: 'tenderness',          neg: 'no tenderness' },
      { key: 'axillaryAdenopathy', short: 'Axilla LN', pos: 'axillary adenopathy', neg: 'no axillary adenopathy' },
      { key: 'nippleDischarge',    short: 'Nipple',    pos: 'nipple discharge',    neg: 'no nipple discharge' },
    ],
  },
  {
    key: 'gu', label: 'G/U', always: false,
    findings: [
      { key: 'lesion',            short: 'Lesion',    pos: 'lesion',             neg: 'no lesions' },
      { key: 'discharge',         short: 'Discharge', pos: 'discharge',          neg: 'no discharge' },
      { key: 'testicularMass',    short: 'Testicular',pos: 'testicular mass',    neg: 'no testicular masses' },
      { key: 'scrotalTenderness', short: 'Scrotum',   pos: 'scrotal tenderness', neg: 'no scrotal tenderness' },
    ],
  },
];
