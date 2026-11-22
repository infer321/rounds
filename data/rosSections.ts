export type ROSFindingDef = {
  key: string;
  short: string;  // chip label in null state (and prefix base for +/−)
  pos: string;    // text for pertinent positive (patient reports)
  neg: string;    // text for pertinent negative (patient denies)
};

export type ROSSectionDef = {
  key: string;
  label: string;
  findings: ROSFindingDef[];
};

export const ROS_SECTIONS: ROSSectionDef[] = [
  {
    key: 'constitutional', label: 'Constitutional',
    findings: [
      { key: 'fever',       short: 'Fever',       pos: 'fever',           neg: 'no fever' },
      { key: 'chills',      short: 'Chills',      pos: 'chills',          neg: 'no chills' },
      { key: 'fatigue',     short: 'Fatigue',     pos: 'fatigue',         neg: 'no fatigue' },
      { key: 'weightLoss',  short: 'Wt loss',     pos: 'weight loss',     neg: 'no weight loss' },
      { key: 'nightSweats', short: 'Night sweats',pos: 'night sweats',    neg: 'no night sweats' },
      { key: 'appetiteLoss',short: 'Appetite',    pos: 'decreased appetite', neg: 'appetite intact' },
    ],
  },
  {
    key: 'heent', label: 'HEENT',
    findings: [
      { key: 'headache',     short: 'Headache',    pos: 'headache',          neg: 'no headache' },
      { key: 'visionChange', short: 'Vision',      pos: 'vision changes',    neg: 'no vision changes' },
      { key: 'eyePain',      short: 'Eye pain',    pos: 'eye pain/redness',  neg: 'no eye pain' },
      { key: 'hearingLoss',  short: 'Hearing',     pos: 'hearing loss',      neg: 'no hearing loss' },
      { key: 'soreThroat',   short: 'Sore throat', pos: 'sore throat',       neg: 'no sore throat' },
      { key: 'congestion',   short: 'Congestion',  pos: 'nasal congestion',  neg: 'no congestion' },
    ],
  },
  {
    key: 'cv', label: 'CV',
    findings: [
      { key: 'chestPain',    short: 'Chest pain',   pos: 'chest pain',        neg: 'no chest pain' },
      { key: 'palpitations', short: 'Palpitations', pos: 'palpitations',      neg: 'no palpitations' },
      { key: 'syncope',      short: 'Syncope',      pos: 'syncope',           neg: 'no syncope' },
      { key: 'legEdema',     short: 'Leg edema',    pos: 'leg edema',         neg: 'no leg edema' },
      { key: 'orthopnea',    short: 'Orthopnea',    pos: 'orthopnea',         neg: 'no orthopnea' },
    ],
  },
  {
    key: 'pulm', label: 'Pulm',
    findings: [
      { key: 'sob',        short: 'SOB',        pos: 'shortness of breath', neg: 'no SOB' },
      { key: 'cough',      short: 'Cough',      pos: 'cough',               neg: 'no cough' },
      { key: 'hemoptysis', short: 'Hemoptysis', pos: 'hemoptysis',          neg: 'no hemoptysis' },
      { key: 'wheezing',   short: 'Wheezing',   pos: 'wheezing',            neg: 'no wheezing' },
    ],
  },
  {
    key: 'gi', label: 'GI',
    findings: [
      { key: 'nausea',       short: 'Nausea',       pos: 'nausea',           neg: 'no nausea' },
      { key: 'vomiting',     short: 'Vomiting',     pos: 'vomiting',         neg: 'no vomiting' },
      { key: 'diarrhea',     short: 'Diarrhea',     pos: 'diarrhea',         neg: 'no diarrhea' },
      { key: 'constipation', short: 'Constipation', pos: 'constipation',     neg: 'no constipation' },
      { key: 'abdPain',      short: 'Abd pain',     pos: 'abdominal pain',   neg: 'no abdominal pain' },
      { key: 'brbpr',        short: 'BRBPR',        pos: 'blood in stool',   neg: 'no blood in stool' },
      { key: 'heartburn',    short: 'Heartburn',    pos: 'heartburn/reflux', neg: 'no heartburn' },
    ],
  },
  {
    key: 'gu', label: 'GU',
    findings: [
      { key: 'dysuria',   short: 'Dysuria',   pos: 'dysuria',           neg: 'no dysuria' },
      { key: 'hematuria', short: 'Hematuria', pos: 'hematuria',         neg: 'no hematuria' },
      { key: 'frequency', short: 'Frequency', pos: 'urinary frequency', neg: 'no urinary frequency' },
      { key: 'urgency',   short: 'Urgency',   pos: 'urinary urgency',   neg: 'no urinary urgency' },
    ],
  },
  {
    key: 'msk', label: 'MSK',
    findings: [
      { key: 'jointPain',  short: 'Joint pain',  pos: 'joint pain',    neg: 'no joint pain' },
      { key: 'myalgia',    short: 'Myalgia',     pos: 'myalgias',      neg: 'no myalgias' },
      { key: 'backPain',   short: 'Back pain',   pos: 'back pain',     neg: 'no back pain' },
      { key: 'stiffness',  short: 'Stiffness',   pos: 'joint stiffness', neg: 'no joint stiffness' },
    ],
  },
  {
    key: 'neuro', label: 'Neuro',
    findings: [
      { key: 'dizziness', short: 'Dizziness', pos: 'dizziness',         neg: 'no dizziness' },
      { key: 'weakness',  short: 'Weakness',  pos: 'weakness',          neg: 'no weakness' },
      { key: 'numbness',  short: 'Numbness',  pos: 'numbness/tingling', neg: 'no numbness' },
      { key: 'seizure',   short: 'Seizure',   pos: 'seizure',           neg: 'no seizure' },
      { key: 'confusion', short: 'Confusion', pos: 'confusion',         neg: 'no confusion' },
    ],
  },
  {
    key: 'psych', label: 'Psych',
    findings: [
      { key: 'depression', short: 'Depression', pos: 'depressed mood', neg: 'no depression' },
      { key: 'anxiety',    short: 'Anxiety',    pos: 'anxiety',        neg: 'no anxiety' },
      { key: 'si',         short: 'SI',         pos: 'SI present',     neg: 'denies SI' },
      { key: 'insomnia',   short: 'Insomnia',   pos: 'insomnia',       neg: 'no insomnia' },
    ],
  },
  {
    key: 'skin', label: 'Skin',
    findings: [
      { key: 'rash',     short: 'Rash',     pos: 'rash',     neg: 'no rash' },
      { key: 'pruritis', short: 'Pruritis', pos: 'pruritis', neg: 'no pruritis' },
    ],
  },
  {
    key: 'heme', label: 'Heme/Lymph',
    findings: [
      { key: 'bleeding', short: 'Bleeding',    pos: 'unusual bleeding',  neg: 'no unusual bleeding' },
      { key: 'bruising', short: 'Bruising',    pos: 'easy bruising',     neg: 'no easy bruising' },
      { key: 'lad',      short: 'Lymph nodes', pos: 'lymphadenopathy',   neg: 'no lymphadenopathy' },
    ],
  },
];
