import { memoData } from '../utils/memo';
/**
 * DiagnosticsInput
 *
 * Smart autocomplete for imaging studies.
 * Workflow: modality → body part → laterality (if needed) → findings
 *
 * Keyboard flow:
 *   • Enter / Next  → select first pill suggestion (or commit findings)
 *   • Backspace on empty text → back one phase
 *   • Tap any pill to select it
 */

import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { ImagingStudy } from '../data/patients';
import { uid } from '../utils/id';
import { useBufferedText } from '../hooks/useBufferedText';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';
import { C } from '../theme';

// ── Imaging data ───────────────────────────────────────────────────────────

type BodyPartDef = { label: string; search: string; needsLateral: boolean };

const MODALITY_DEFS = [
  { label: 'XR',  search: 'xr x xray x-ray plain film radiograph' },
  { label: 'CT',  search: 'ct cat scan computed' },
  { label: 'MRI', search: 'mri mr m magnetic resonance' },
  { label: 'US',  search: 'us u ultrasound sono sonogram doppler' },
];

const BODY_PARTS: BodyPartDef[] = [
  { label: 'Brain',               search: 'brain head cranial cranium',             needsLateral: false },
  { label: 'Orbits',              search: 'orbits orbit eye eyes orbital',           needsLateral: false },
  { label: 'Neck Soft Tissue',    search: 'neck soft tissue cervical',               needsLateral: false },
  { label: 'Chest',               search: 'chest thorax lung lungs cxr pa',         needsLateral: false },
  { label: 'Abdomen',             search: 'abdomen abdominal belly',                 needsLateral: false },
  { label: 'Abdomen/Pelvis',      search: 'abdomen pelvis ap a/p',                  needsLateral: false },
  { label: 'Pelvis',              search: 'pelvis pelvic',                           needsLateral: false },
  { label: 'KUB',                 search: 'kub kidney ureter bladder',              needsLateral: false },
  { label: 'Cervical Spine',      search: 'cervical spine c spine c-spine',         needsLateral: false },
  { label: 'Thoracic Spine',      search: 'thoracic spine t spine t-spine',         needsLateral: false },
  { label: 'Lumbar Spine',        search: 'lumbar spine l spine l-spine back',      needsLateral: false },
  { label: 'Whole Spine',         search: 'whole spine full spine',                 needsLateral: false },
  { label: 'Shoulder',            search: 'shoulder',                                needsLateral: true  },
  { label: 'Humerus',             search: 'humerus upper arm bone',                 needsLateral: true  },
  { label: 'Elbow',               search: 'elbow',                                   needsLateral: true  },
  { label: 'Forearm',             search: 'forearm radius ulna',                    needsLateral: true  },
  { label: 'Wrist',               search: 'wrist',                                   needsLateral: true  },
  { label: 'Hand',                search: 'hand finger fingers',                    needsLateral: true  },
  { label: 'Hip',                 search: 'hip',                                     needsLateral: true  },
  { label: 'Femur',               search: 'femur thigh bone',                       needsLateral: true  },
  { label: 'Knee',                search: 'knee',                                    needsLateral: true  },
  { label: 'Tibia/Fibula',        search: 'tibia fibula lower leg shin',            needsLateral: true  },
  { label: 'Ankle',               search: 'ankle',                                   needsLateral: true  },
  { label: 'Foot',                search: 'foot feet toe toes',                     needsLateral: true  },
  { label: 'Aorta',               search: 'aorta aortic',                           needsLateral: false },
  { label: 'Renal',               search: 'renal kidney bladder',                   needsLateral: false },
  { label: 'Hepatobiliary',       search: 'liver hepatic gallbladder biliary gb',   needsLateral: false },
  { label: 'Thyroid',             search: 'thyroid',                                 needsLateral: false },
  { label: 'Carotid',             search: 'carotid',                                 needsLateral: true  },
  { label: 'LE Venous (DVT)',     search: 'dvt lower extremity venous le leg',      needsLateral: true  },
  { label: 'UE Venous',           search: 'upper extremity venous ue arm dvt',      needsLateral: true  },
  { label: 'PE Protocol',         search: 'pe pulmonary embolism ctpa',             needsLateral: false },
  { label: 'Echo (TTE)',          search: 'echo tte heart cardiac transthoracic',  needsLateral: false },
  { label: 'Echo (TEE)',          search: 'tee transesophageal echo',              needsLateral: false },
  { label: 'Angio Head/Neck',     search: 'angio cta mra head neck angiography',    needsLateral: false },
];

const LATERALITY = ['Right', 'Left', 'Bilateral'];

/** Returns true if every character in query appears in order in target. */
function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── Types ──────────────────────────────────────────────────────────────────

type Phase = 'modality' | 'bodyPart' | 'laterality' | 'findings';

type Draft = {
  modality: string;
  bodyPart: BodyPartDef | null;
  laterality: string;
};

type Props = {
  studies: ImagingStudy[];
  onChange: (s: ImagingStudy[]) => void;
};

const BORDER = C.line;
const BG     = C.surface;
const MAX_PILLS = 12;

// ── Pure helpers ───────────────────────────────────────────────────────────

const PLACEHOLDER: Record<Phase, string> = {
  modality:   'Add study (XR, CT, MRI, US)…',
  bodyPart:   'Body region…',
  laterality: 'Laterality…',
  findings:   'Findings…',
};

/** Suggestion pills for the current phase. */
function pillsFor(phase: Phase, text: string): string[] {
  if (phase === 'modality') {
    return MODALITY_DEFS.filter(m => fuzzyMatch(text, m.label) || fuzzyMatch(text, m.search)).map(m => m.label);
  }
  if (phase === 'bodyPart') {
    const pool = text ? BODY_PARTS.filter(b => fuzzyMatch(text, b.label) || fuzzyMatch(text, b.search)) : BODY_PARTS;
    return pool.slice(0, MAX_PILLS).map(b => b.label);
  }
  if (phase === 'laterality') return LATERALITY.filter(l => fuzzyMatch(text, l));
  return [];
}

/** Locked text shown before the cursor, e.g. "CT Chest, Left: ". */
function prefixFor(phase: Phase, d: Draft): string {
  if (phase === 'bodyPart')   return `${d.modality} `;
  if (phase === 'laterality') return `${d.modality} ${d.bodyPart?.label}, `;
  if (phase === 'findings')   return `${d.modality} ${d.bodyPart?.label}${d.laterality ? `, ${d.laterality}` : ''}: `;
  return '';
}

// ── Committed study row (buffered typing, like other note fields) ──────────

function StudyRow({ study, onFindings, onRemove }: { study: ImagingStudy; onFindings: (v: string) => void; onRemove: () => void }) {
  const buf = useBufferedText(study.findings, onFindings);
  const where = [study.bodyPart, study.laterality].filter(Boolean).join(', ');
  return (
    <View style={st.studyRow}>
      <View style={st.studyBody}>
        <Text style={st.studyLabel}>{study.modality} {where}</Text>
        <TextInput style={st.studyFindings} value={buf.text} onChangeText={buf.setText}
          onFocus={buf.onFocus} onBlur={buf.onBlur}
          multiline placeholder="pending…" placeholderTextColor={C.ink4} textAlignVertical="top" />
      </View>
      <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${study.modality} ${where}`}>
        <Icon name="close" size={16} color={C.ink4} />
      </Pressable>
    </View>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

function DiagnosticsInput({ studies, onChange }: Props) {
  const [phase, setPhase] = useState<Phase>('modality');
  const [text,  setText]  = useState('');
  const [draft, setDraft] = useState<Draft>({ modality: '', bodyPart: null, laterality: '' });
  const inputRef = useRef<TextInput>(null);
  const toast = useToast();

  const suggestions = pillsFor(phase, text);
  const prefix = prefixFor(phase, draft);

  // ── Selection ──────────────────────────────────────────────────────────
  function selectSuggestion(label: string) {
    if (phase === 'modality') {
      setDraft({ modality: label, bodyPart: null, laterality: '' });
      setText('');
      setPhase('bodyPart');
    } else if (phase === 'bodyPart') {
      const bp = BODY_PARTS.find(b => b.label === label)!;
      setDraft(d => ({ ...d, bodyPart: bp, laterality: '' }));
      setText('');
      setPhase(bp.needsLateral ? 'laterality' : 'findings');
    } else if (phase === 'laterality') {
      setDraft(d => ({ ...d, laterality: label }));
      setText('');
      setPhase('findings');
    }
    // Keep keyboard up
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  // ── Commit findings → lock in study (optionally start the next one) ─
  function commit(nextModality?: string) {
    if (!draft.modality || !draft.bodyPart) return;
    onChange([...studies, {
      id: uid(),
      modality: draft.modality,
      bodyPart: draft.bodyPart.label,
      laterality: draft.laterality || undefined,
      findings: text.trim(),
    }]);
    setDraft({ modality: nextModality ?? '', bodyPart: null, laterality: '' });
    setText('');
    setPhase(nextModality ? 'bodyPart' : 'modality');
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function remove(study: ImagingStudy) {
    const idx = studies.findIndex(x => x.id === study.id);
    onChange(studies.filter(x => x.id !== study.id));
    toast({ message: `Removed ${study.modality} ${study.bodyPart}`, onUndo: () => {
      const next = studies.filter(x => x.id !== study.id); next.splice(idx, 0, study); onChange(next);
    } });
  }

  // ── Enter key ──────────────────────────────────────────────────────────
  function handleSubmit() {
    if (phase === 'findings') { commit(); return; }
    if (suggestions.length > 0) selectSuggestion(suggestions[0]);
  }

  // ── Backspace on empty → go back a phase ──────────────────────────────
  function handleKeyPress(e: { nativeEvent: { key: string } }) {
    if (e.nativeEvent.key !== 'Backspace' || text !== '') return;
    if (phase === 'bodyPart') {
      setPhase('modality');
      setDraft(d => ({ ...d, modality: '' }));
    } else if (phase === 'laterality') {
      setPhase('bodyPart');
      setDraft(d => ({ ...d, bodyPart: null }));
    } else if (phase === 'findings') {
      if (draft.bodyPart?.needsLateral) {
        setPhase('laterality');
        setDraft(d => ({ ...d, laterality: '' }));
      } else {
        setPhase('bodyPart');
        setDraft(d => ({ ...d, bodyPart: null }));
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={st.container}>

      {studies.map(study => (
        <StudyRow key={study.id} study={study}
          onFindings={v => onChange(studies.map(x => x.id === study.id ? { ...x, findings: v } : x))}
          onRemove={() => remove(study)} />
      ))}

      {/* ── Active input area ──────────────────────────────────── */}
      <View style={st.activeArea}>

        {/* Text row: locked prefix + editable tail */}
        <View style={st.inputRow}>
          {!!prefix && <Text style={st.prefix}>{prefix}</Text>}
          <TextInput
            ref={inputRef}
            style={st.input}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSubmit}
            onKeyPress={handleKeyPress}
            returnKeyType={phase === 'findings' ? 'done' : 'next'}
            placeholder={PLACEHOLDER[phase]}
            placeholderTextColor={C.ink4}
            submitBehavior="submit"
            autoCorrect={phase === 'findings'}
            autoCapitalize={phase === 'findings' ? 'sentences' : 'none'}
            autoComplete="off"
          />
        </View>

        {/* Suggestion pills (modality / bodyPart / laterality phases) */}
        {suggestions.length > 0 && (
          <View style={st.pills}>
            {suggestions.map((s, i) => (
              <Pressable
                key={s}
                style={({ pressed }) => [st.pill, i === 0 && st.pillPrimary, pressed && { opacity: 0.7 }]}
                onPress={() => selectSuggestion(s)}
              >
                <Text style={[st.pillText, i === 0 && st.pillPrimaryText]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Next-study modality quick-start (findings phase only) */}
        {phase === 'findings' && (
          <View style={st.nextRow}>
            <Text style={st.nextLabel}>Next</Text>
            {MODALITY_DEFS.map(m => (
              <Pressable
                key={m.label}
                style={({ pressed }) => [st.nextPill, pressed && { opacity: 0.7 }]}
                onPress={() => commit(m.label)}
              >
                <Text style={st.nextPillText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BORDER,
    overflow: 'hidden',
  },

  // Committed study row
  studyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
    gap: 6,
  },
  studyBody: { flex: 1 },
  studyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  studyFindings: {
    fontSize: 13,
    color: C.ink,
    paddingVertical: 0,
    lineHeight: 18,
  },

  // Active input area
  activeArea: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  prefix: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink2,
  },
  input: {
    flex: 1,
    minWidth: 80,
    fontSize: 13,
    color: C.ink,
    paddingVertical: 0,
  },

  // Suggestion pills
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  pillPrimary: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.ink2,
  },
  pillPrimaryText: {
    color: C.onInk,
  },

  // Next-study quick-start row (shown while typing findings)
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.ink4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginRight: 2,
  },
  nextPill: {
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  nextPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.ink3,
  },
});

export default memoData(DiagnosticsInput);
