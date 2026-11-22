import { HAndP, Labs, PanelKey, Snapshot, MAX_HISTORY } from '../data/patients';
import { PANELS, hasAny, vitalsHasData } from './clinical';

/** Current values → "previous" row + history; current cleared for the new day. */
export function advanceHP(hp: HAndP, panels: PanelKey[]): HAndP {
  const snap: Snapshot = { at: Date.now() };
  const labs: Labs = { ...hp.labs };
  const prevLabs: Labs = { ...hp.prevLabs };
  let { vitals, prevVitals } = hp;

  for (const panel of panels) {
    if (panel === 'vitals') {
      if (!vitalsHasData(vitals)) continue;
      snap.vitals = vitals; prevVitals = vitals; vitals = {};
      continue;
    }
    const keys = PANELS[panel];
    const vals: Labs = {};
    keys.forEach(k => { if (labs[k]) vals[k] = labs[k]; });
    if (!hasAny(vals)) continue;
    // Replace the previous row for this whole panel so stale values don't linger
    keys.forEach(k => { prevLabs[k] = vals[k]; labs[k] = undefined; });
    snap.labs = { ...snap.labs, ...vals };
  }
  if (!snap.vitals && !snap.labs) return hp;
  const history = [...(hp.history ?? []), snap].slice(-MAX_HISTORY);
  return { ...hp, labs, prevLabs, vitals, prevVitals, history };
}
