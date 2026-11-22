import { HAndP, Labs, PanelKey, Snapshot, MAX_HISTORY } from '../data/patients';
import { PANELS, hasAny, vitalsHasData } from './clinical';

/** Moves one panel's values from `labs` to `prevLabs` (in place). Returns the moved values, or null if empty. */
function movePanel(labs: Labs, prevLabs: Labs, keys: (keyof Labs)[]): Labs | null {
  const vals: Labs = {};
  keys.forEach(k => { if (labs[k]) vals[k] = labs[k]; });
  if (!hasAny(vals)) return null;
  // Replace the whole previous row for this panel so stale values don't linger
  keys.forEach(k => { prevLabs[k] = vals[k]; labs[k] = undefined; });
  return vals;
}

/** Archive today's plan + subjective into the snapshot (A/P carries forward; subjective starts fresh). */
function archiveText(hp: HAndP, snap: Snapshot) {
  if (hp.ap?.trim()) snap.ap = hp.ap;
  if (hp.subjective?.trim()) snap.subjective = hp.subjective;
}

/** Current values → "previous" row + history; current cleared for the new day. */
export function advanceHP(hp: HAndP, panels: PanelKey[], wholeRound = false): HAndP {
  const snap: Snapshot = { at: Date.now() };
  const labs: Labs = { ...hp.labs };
  const prevLabs: Labs = { ...hp.prevLabs };
  let { vitals, prevVitals } = hp;

  for (const panel of panels) {
    if (panel === 'vitals') {
      if (!vitalsHasData(vitals)) continue;
      snap.vitals = vitals; prevVitals = vitals; vitals = {};
    } else {
      const moved = movePanel(labs, prevLabs, PANELS[panel]);
      if (moved) snap.labs = { ...snap.labs, ...moved };
    }
  }
  if (wholeRound) archiveText(hp, snap);
  if (!snap.vitals && !snap.labs && !snap.ap && !snap.subjective) return hp;
  const history = [...(hp.history ?? []), snap].slice(-MAX_HISTORY);
  return { ...hp, labs, prevLabs, vitals, prevVitals, history, ...(wholeRound ? { subjective: undefined } : {}) };
}
