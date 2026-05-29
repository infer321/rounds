export type ItemType = 'timer' | 'task';

export type Vitals = {
  temp?: string; rr?: string; hr?: string;
  bpS?: string; bpD?: string;
  o2Mode?: 'RA' | 'NC' | 'BiPAP';
  o2Val?: string;
};

export type Labs = {
  wbc?: string; hgb?: string; plt?: string;
  na?: string; k?: string; cl?: string; co2?: string;
  bun?: string; cr?: string; glu?: string;
};

export type HAndP = {
  hpi?: string;
  course?: string;
  vitals?: Vitals;
  pe?: string;
  labs?: Labs;
  diagnostics?: string;
  ap?: string;
};

export type Item = {
  id: string;
  type: ItemType;
  label: string;
  endsAt?: number;
  notificationId?: string;
  signout?: boolean;
  urgent?: boolean;
};

export type Patient = {
  id: string;
  initials: string;
  age?: string;
  gender?: string;
  descriptor?: string;
  colorIndex: number;
  items: Item[];
  hp?: HAndP;
};

export const COLORS = ['#E1F5EE', '#EEEDFE', '#FAEEDA', '#FCEBEB', '#E6F1FB', '#F0F0F0'];
export const TEXT_COLORS = ['#085041', '#3C3489', '#633806', '#A32D2D', '#0C447C', '#444'];
export const DOT_COLORS: Record<ItemType, string> = {
  timer: '#1D9E75',
  task: '#7F77DD',
};

const t = Date.now();
const min = 60_000;
const hr = 3_600_000;

export const SAMPLE_PATIENTS: Patient[] = [
  {
    id: '1', initials: 'JM', colorIndex: 3,
    items: [
      { id: 'a', type: 'timer', label: 'Troponin due', endsAt: t + 2 * min },
      { id: 'b', type: 'task', label: 'Consult cardio' },
      { id: 'c', type: 'task', label: 'Code status', signout: true },
    ]
  },
  {
    id: '2', initials: 'SR', colorIndex: 0,
    items: [
      { id: 'd', type: 'timer', label: 'CT head', endsAt: t + 1 * hr + 20 * min },
      { id: 'e', type: 'timer', label: 'Bx culture', endsAt: t + 46 * hr },
      { id: 'f', type: 'task', label: 'Consult IR' },
    ]
  },
  {
    id: '3', initials: 'AL', colorIndex: 1,
    items: [
      { id: 'g', type: 'timer', label: 'Lactate repeat', endsAt: t + 45 * min },
      { id: 'h', type: 'task', label: 'Family update', signout: true },
    ]
  },
  {
    id: '4', initials: 'TK', colorIndex: 4,
    items: [
      { id: 'i', type: 'task', label: 'Post-op vitals q15' },
      { id: 'j', type: 'timer', label: 'INR check', endsAt: t + 3 * hr + 10 * min },
    ]
  },
  {
    id: '5', initials: 'PW', colorIndex: 2,
    items: [
      { id: 'k', type: 'task', label: 'Discuss dispo', signout: true },
    ]
  },
];
