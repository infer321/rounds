import { memoData } from '../../utils/memo';
import { useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Vitals } from '../../data/patients';
import { NUMERIC_RE, VitKey, vitFlag } from '../../utils/clinical';
import { flagColor } from '../LabFishbone';
import { Segmented } from '../ui';
import { C, T, R, S } from '../../theme';

const ORDER: VitKey[] = ['temp', 'hr', 'rr', 'bpS', 'bpD', 'spo2'];
const MAXLEN: Record<VitKey, number> = { temp: 4, hr: 3, rr: 2, bpS: 3, bpD: 3, spo2: 3 };
const O2_MODES = [['RA', 'RA'], ['NC', 'NC'], ['BiPAP', 'BiPAP']] as const;

type Props = { vitals: Vitals; prev: Vitals; onChange: (p: Partial<Vitals>) => void };

function VitalsBlock({ vitals: v, prev: pv, onChange }: Props) {
  const refs = useRef<Partial<Record<VitKey, TextInput | null>>>({});
  const next = (k: VitKey) => refs.current[ORDER[ORDER.indexOf(k) + 1]]?.focus();

  const cell = (k: VitKey, label: string, unit?: string) => (
    <Pressable key={k} style={st.cell} onPress={() => refs.current[k]?.focus()}>
      <Text style={st.label}>{label}</Text>
      <TextInput
        ref={r => { refs.current[k] = r; }}
        style={[st.input, { color: flagColor(vitFlag(k, v[k])) }]}
        value={v[k] ?? ''}
        onChangeText={t => { if (NUMERIC_RE.test(t)) onChange({ [k]: t }); }}
        keyboardType="decimal-pad"
        returnKeyType={k === 'spo2' ? 'done' : 'next'}
        submitBehavior={k === 'spo2' ? 'blurAndSubmit' : 'submit'}
        onSubmitEditing={() => next(k)}
        placeholder="–"
        placeholderTextColor={C.ink4}
        textAlign="center"
        selectTextOnFocus
        maxLength={MAXLEN[k]}
        maxFontSizeMultiplier={1.2}
        accessibilityLabel={`${label}${pv[k] ? `, previous ${pv[k]}` : ''}`}
      />
      <Text style={[st.prev, { color: flagColor(vitFlag(k, pv[k]), true) }]}>{pv[k] ? `${pv[k]}${unit ?? ''}` : ' '}</Text>
    </Pressable>
  );

  const bpFlag = vitFlag('bpS', v.bpS) ?? vitFlag('bpD', v.bpD);
  const prevBp = pv.bpS || pv.bpD ? `${pv.bpS ?? '–'}/${pv.bpD ?? '–'}` : ' ';

  return (
    <View style={st.card}>
      <View style={st.row}>
        {cell('temp', 'T °C')}
        {cell('hr', 'HR')}
        {cell('rr', 'RR')}
        <View style={[st.cell, { flex: 1.8 }]}>
          <Text style={st.label}>BP</Text>
          <View style={st.bp}>
            {(['bpS', 'bpD'] as const).map((k, i) => (
              <View key={k} style={st.bpHalf}>
                {i === 1 && <Text style={st.slash}>/</Text>}
                <TextInput
                  ref={r => { refs.current[k] = r; }}
                  style={[st.input, { flex: 1, color: flagColor(bpFlag) }]}
                  value={v[k] ?? ''}
                  onChangeText={t => { if (/^\d*$/.test(t)) onChange({ [k]: t }); }}
                  keyboardType="number-pad"
                  returnKeyType="next" submitBehavior="submit"
                  onSubmitEditing={() => next(k)}
                  placeholder="–" placeholderTextColor={C.ink4}
                  textAlign="center" selectTextOnFocus maxLength={3} maxFontSizeMultiplier={1.2}
                />
              </View>
            ))}
          </View>
          <Text style={[st.prev, { color: C.ink4 }]}>{prevBp}</Text>
        </View>
      </View>

      <View style={[st.row, st.rowTop]}>
        {cell('spo2', 'SpO₂ %')}
        <View style={[st.cell, { flex: 2.8, alignItems: 'flex-start', paddingLeft: S.sm }]}>
          <Text style={st.label}>O₂ support</Text>
          <View style={st.o2}>
            <Segmented options={O2_MODES} value={v.o2Mode} size="sm" allowNone
              onChange={m => onChange({ o2Mode: m, o2Val: m === 'NC' || m === 'BiPAP' ? v.o2Val : undefined })} />
            {(v.o2Mode === 'NC' || v.o2Mode === 'BiPAP') && (
              <TextInput
                style={st.o2Val}
                value={v.o2Val ?? ''}
                onChangeText={t => { if (/^[\d./]*$/.test(t)) onChange({ o2Val: t }); }}
                keyboardType="numbers-and-punctuation"
                placeholder={v.o2Mode === 'NC' ? 'L/min' : 'IPAP/EPAP'}
                placeholderTextColor={C.ink4}
                textAlign="center" maxLength={7}
              />
            )}
          </View>
          <Text style={[st.prev, { color: C.ink4 }]}>
            {pv.o2Mode ? `${pv.o2Mode}${pv.o2Val ? ' ' + pv.o2Val : ''}` : ' '}
          </Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card:  { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, paddingVertical: S.sm },
  row:   { flexDirection: 'row' },
  rowTop:{ borderTopWidth: 0.5, borderTopColor: C.line, marginTop: S.sm, paddingTop: S.sm },
  cell:  { flex: 1, alignItems: 'center' },
  label: { ...T.label, fontSize: 10, marginBottom: 2 },
  input: { fontSize: 18, fontWeight: '600', ...T.num, minWidth: 44, paddingVertical: 4 },
  prev:  { ...T.num, fontSize: 11, height: 14 },
  bp:    { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 4 },
  bpHalf:{ flex: 1, flexDirection: 'row', alignItems: 'center' },
  slash: { fontSize: 18, color: C.ink4 },
  o2:    { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: 34 },
  o2Val: { ...T.bodyM, ...T.num, borderBottomWidth: 1, borderBottomColor: C.line, minWidth: 64, paddingVertical: 4 },
});

export default memoData(VitalsBlock);
