/** Initials / age / sex / one-liner fields, shared by "New patient" and "Patient details". */
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Patient } from '../data/patients';
import { Field, Segmented } from './ui';
import { C, T, S } from '../theme';

export type PatientDraft = { initials: string; age: string; gender: string; descriptor: string };

export function usePatientDraft() {
  const [draft, setDraft] = useState<PatientDraft>({ initials: '', age: '', gender: '', descriptor: '' });
  return {
    draft,
    set: (p: Partial<PatientDraft>) => setDraft(d => ({ ...d, ...p })),
    reset: (p?: Patient) => setDraft({ initials: p?.initials ?? '', age: p?.age ?? '', gender: p?.gender ?? '', descriptor: p?.descriptor ?? '' }),
    valid: !!draft.initials.trim(),
  };
}

const SEX = [['M', 'M'], ['F', 'F'], ['X', 'X']] as const;

export default function PatientForm({ draft, set, onSubmit, autoFocus }: {
  draft: PatientDraft; set: (p: Partial<PatientDraft>) => void; onSubmit: () => void; autoFocus?: boolean;
}) {
  return (
    <View style={{ gap: S.sm }}>
      <View style={{ flexDirection: 'row', gap: S.sm }}>
        <Field style={st.initials} placeholder="ABC" value={draft.initials} onChangeText={v => set({ initials: v })}
          autoFocus={autoFocus} maxLength={3} autoCapitalize="characters" autoCorrect={false} accessibilityLabel="Initials" />
        <Field style={st.age} placeholder="Age" value={draft.age} keyboardType="number-pad" maxLength={3}
          onChangeText={v => /^\d*$/.test(v) && set({ age: v })} />
        <Segmented options={SEX} value={draft.gender || undefined} onChange={v => set({ gender: v ?? '' })} allowNone size="sm" style={st.sex} />
      </View>
      <Field placeholder="One-liner, e.g. CHF exacerbation" value={draft.descriptor} onChangeText={v => set({ descriptor: v })}
        returnKeyType="done" onSubmitEditing={onSubmit} />
      <Text style={st.note}>Initials, age and a clinical descriptor only. No names, MRNs or DOBs.</Text>
    </View>
  );
}

const st = StyleSheet.create({
  initials: { flex: 1, fontSize: 20, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  age:      { width: 76, textAlign: 'center' },
  sex:      { alignItems: 'center' },
  note:     { ...T.caption, color: C.ink4, marginTop: 2 },
});
