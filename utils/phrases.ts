/**
 * Dot phrases for the A/P box: type ".aki" and pick the chip.
 * Built-ins are deliberately generic scaffolds (no doses): edit to your
 * team's practice or add your own in Settings → Phrases.
 */
export type Phrase = { id: string; trigger: string; text: string; builtIn?: boolean };

export const BUILT_IN_PHRASES: Phrase[] = [
  { id: 'p-aki', trigger: 'aki', text: '# AKI\n- Etiology: \n- Trend Cr / BMP daily, strict I/Os\n- Renally dose meds, avoid nephrotoxins\n- UA, urine lytes; renal US if not improving' },
  { id: 'p-cp', trigger: 'cp', text: '# Chest pain\n- Serial troponin, repeat EKG\n- Telemetry\n- Risk stratify (HEART)\n- ' },
  { id: 'p-chf', trigger: 'chf', text: '# Acute on chronic HF\n- IV diuresis, goal net negative \n- Daily weights, strict I/Os, fluid restriction\n- BMP + Mg daily, replete K/Mg\n- GDMT as BP/renal function allow' },
  { id: 'p-copd', trigger: 'copd', text: '# COPD exacerbation\n- Bronchodilators, systemic steroids\n- Antibiotics if indicated\n- O2 goal SpO2 88-92%\n- ' },
  { id: 'p-pna', trigger: 'pna', text: '# Pneumonia\n- Abx: \n- Blood/sputum cultures, procalcitonin\n- O2 as needed, incentive spirometry\n- ' },
  { id: 'p-sepsis', trigger: 'sepsis', text: '# Sepsis\n- Source: \n- Cultures before abx, broad-spectrum abx\n- Fluids, trend lactate\n- MAP goal >65' },
  { id: 'p-uti', trigger: 'uti', text: '# UTI\n- UA / urine culture\n- Abx: \n- Narrow to sensitivities' },
  { id: 'p-afib', trigger: 'afib', text: '# Atrial fibrillation\n- Rate control: \n- Anticoagulation: CHA2DS2-VASc , HAS-BLED \n- TSH, echo if not recent\n- Telemetry' },
  { id: 'p-dka', trigger: 'dka', text: '# DKA\n- Insulin drip per protocol, fluids\n- BMP q2-4h, close the gap\n- Replete K before insulin if low\n- Trigger: ' },
  { id: 'p-gib', trigger: 'gib', text: '# GI bleed\n- 2 large-bore IVs, type and screen\n- Trend Hgb, transfuse goal \n- IV PPI, GI consult\n- Hold anticoagulation' },
  { id: 'p-etoh', trigger: 'etoh', text: '# Alcohol use / withdrawal risk\n- CIWA monitoring\n- Thiamine, folate, MVI\n- SW / addiction medicine consult' },
  { id: 'p-ppx', trigger: 'ppx', text: '# Prophylaxis\n- VTE: \n- GI: \n- Diet: \n- Code: ' },
];

/** Phrases whose trigger starts with the typed text after the dot. */
export function matchPhrases(typed: string, phrases: Phrase[]): Phrase[] {
  const q = typed.replace(/^\./, '').toLowerCase();
  return phrases.filter(p => p.trigger.toLowerCase().startsWith(q)).slice(0, 8);
}
