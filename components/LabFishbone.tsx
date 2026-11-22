/**
 * Lab entry diagrams. Values color red (high) / blue (low); yesterday's value
 * sits faded above each cell. Return key walks LAB_ORDER across all panels.
 */
import { useRef, useState, MutableRefObject } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Labs } from '../data/patients';
import { LabKey, LAB_LABEL, LAB_MAXLEN, NUMERIC_RE, labFlag, Flag } from '../utils/clinical';
import { C, T, R } from '../theme';

const STROKE = C.lineStrong;
const SW = 1.25;

export const flagColor = (f: Flag, faded = false) =>
  f === 'H' ? (faded ? '#D9A19C' : C.high) : f === 'L' ? (faded ? '#97B4D6' : C.low) : (faded ? C.ink4 : C.ink);

type Refs = MutableRefObject<Partial<Record<LabKey, TextInput | null>>>;
type FishProps = {
  labs: Labs; prevLabs?: Labs; labRefs: Refs;
  patchLab: (k: LabKey, v: string) => void;
  advance: (k: LabKey) => void;
};

function Cell({ k, value, prev, onChange, inputRef, onNext, isLast, style }: {
  k: LabKey; value: string; prev?: string;
  onChange: (v: string) => void; inputRef: (r: TextInput | null) => void;
  onNext: () => void; isLast: boolean; style?: object;
}) {
  const ref = useRef<TextInput | null>(null);
  const f = labFlag(k, value);
  return (
    <Pressable style={[st.cell, style]} onPress={() => ref.current?.focus()}>
      <Text style={[st.prev, { color: flagColor(labFlag(k, prev), true) }]} numberOfLines={1}>{prev ?? ' '}</Text>
      <TextInput
        ref={r => { ref.current = r; inputRef(r); }}
        style={[st.input, { color: flagColor(f) }]}
        value={value}
        onChangeText={t => { if (NUMERIC_RE.test(t)) onChange(t); }}
        keyboardType="decimal-pad"
        returnKeyType={isLast ? 'done' : 'next'}
        onSubmitEditing={isLast ? undefined : onNext}
        submitBehavior={isLast ? 'blurAndSubmit' : 'submit'}
        placeholder={LAB_LABEL[k]}
        placeholderTextColor={C.ink4}
        textAlign="center"
        selectTextOnFocus
        maxLength={LAB_MAXLEN[k]}
        accessibilityLabel={LAB_LABEL[k]}
      />
      {!!value && <Text style={st.unitLabel}>{LAB_LABEL[k]}</Text>}
    </Pressable>
  );
}

function useWidth() {
  const [w, setW] = useState(0);
  return { w, onLayout: (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width) };
}

function cellFactory({ labs, prevLabs, labRefs, patchLab, advance }: FishProps, lastKey?: LabKey) {
  return (k: LabKey, style: object) => (
    <Cell key={k} k={k} value={labs[k] ?? ''} prev={prevLabs?.[k]}
      onChange={v => patchLab(k, v)}
      inputRef={r => { labRefs.current[k] = r; }}
      onNext={() => advance(k)} isLast={k === lastKey} style={style} />
  );
}

const H = 132;
const abs = (left: number, top: number, width: number, height: number) => ({ position: 'absolute', left, top, width, height });

//   \   Hgb   /
//  WBC ───── Plt
//   /   Hct   \
export function CBCFishbone(props: FishProps) {
  const { w, onLayout } = useWidth();
  const cx1 = w * 0.3, cx2 = w * 0.7, cy = H / 2, inset = w * 0.05;
  const c = cellFactory(props);
  return (
    <View style={[st.box, { height: H }]} onLayout={onLayout}>
      {w > 0 && <>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Line x1={cx1} y1={cy} x2={cx2} y2={cy} stroke={STROKE} strokeWidth={SW} />
          <Line x1={inset} y1={14} x2={cx1} y2={cy} stroke={STROKE} strokeWidth={SW} />
          <Line x1={inset} y1={H - 14} x2={cx1} y2={cy} stroke={STROKE} strokeWidth={SW} />
          <Line x1={cx2} y1={cy} x2={w - inset} y2={14} stroke={STROKE} strokeWidth={SW} />
          <Line x1={cx2} y1={cy} x2={w - inset} y2={H - 14} stroke={STROKE} strokeWidth={SW} />
        </Svg>
        {c('wbc', abs(0, 0, cx1, H))}
        {c('hgb', abs(cx1, 0, cx2 - cx1, cy))}
        {c('hct', abs(cx1, cy, cx2 - cx1, H - cy))}
        {c('plt', abs(cx2, 0, w - cx2, H))}
      </>}
    </View>
  );
}

//  Na | Cl | BUN \
//  ───────────────  Glu
//  K  | CO2| Cr  /
export function BMPFishbone(props: FishProps) {
  const { w, onLayout } = useWidth();
  const cy = H / 2, v1 = w * 0.25, v2 = w * 0.5, tail = w * 0.75, out = w * 0.95;
  const c = cellFactory(props);
  return (
    <View style={[st.box, { height: H }]} onLayout={onLayout}>
      {w > 0 && <>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Line x1={0} y1={cy} x2={tail} y2={cy} stroke={STROKE} strokeWidth={SW} />
          <Line x1={v1} y1={12} x2={v1} y2={H - 12} stroke={STROKE} strokeWidth={SW} />
          <Line x1={v2} y1={12} x2={v2} y2={H - 12} stroke={STROKE} strokeWidth={SW} />
          <Line x1={tail} y1={cy} x2={out} y2={10} stroke={STROKE} strokeWidth={SW} />
          <Line x1={tail} y1={cy} x2={out} y2={H - 10} stroke={STROKE} strokeWidth={SW} />
        </Svg>
        {c('na', abs(0, 0, v1, cy))}
        {c('k', abs(0, cy, v1, H - cy))}
        {c('cl', abs(v1, 0, v2 - v1, cy))}
        {c('co2', abs(v1, cy, v2 - v1, H - cy))}
        {c('bun', abs(v2, 0, tail - v2, cy))}
        {c('cr', abs(v2, cy, tail - v2, H - cy))}
        {c('glu', abs(tail, 0, w - tail, H))}
      </>}
    </View>
  );
}

//  Ca | TP | AST | LDH \
//  ──────────────────── Tbili
//  Phos| Alb| ALT | ALP /
export function LFTFishbone(props: FishProps) {
  const { w, onLayout } = useWidth();
  const cy = H / 2, v1 = w * 0.2, v2 = w * 0.4, v3 = w * 0.6, tail = w * 0.8, out = w * 0.96;
  const c = cellFactory(props);
  return (
    <View style={[st.box, { height: H }]} onLayout={onLayout}>
      {w > 0 && <>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Line x1={0} y1={cy} x2={tail} y2={cy} stroke={STROKE} strokeWidth={SW} />
          {[v1, v2, v3].map(x => <Line key={x} x1={x} y1={12} x2={x} y2={H - 12} stroke={STROKE} strokeWidth={SW} />)}
          <Line x1={tail} y1={cy} x2={out} y2={10} stroke={STROKE} strokeWidth={SW} />
          <Line x1={tail} y1={cy} x2={out} y2={H - 10} stroke={STROKE} strokeWidth={SW} />
        </Svg>
        {c('ca', abs(0, 0, v1, cy))}
        {c('po4', abs(0, cy, v1, H - cy))}
        {c('tp', abs(v1, 0, v2 - v1, cy))}
        {c('alb', abs(v1, cy, v2 - v1, H - cy))}
        {c('ast', abs(v2, 0, v3 - v2, cy))}
        {c('alt', abs(v2, cy, v3 - v2, H - cy))}
        {c('ldh', abs(v3, 0, tail - v3, cy))}
        {c('ap', abs(v3, cy, tail - v3, H - cy))}
        {c('bili', abs(tail, 0, w - tail, H))}
      </>}
    </View>
  );
}

/** Plain row of cells (Mg + coags). */
export function LabRow(props: FishProps & { keys: LabKey[] }) {
  const c = cellFactory(props, props.keys[props.keys.length - 1]);
  return (
    <View style={[st.box, st.row]}>
      {props.keys.map((k, i) => (
        <View key={k} style={[st.rowCell, i > 0 && st.rowDivider]}>{c(k, { flex: 1, height: 64 })}</View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  box:  { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 0.5, borderColor: C.line, overflow: 'hidden' },
  row:  { flexDirection: 'row' },
  rowCell: { flex: 1 },
  rowDivider: { borderLeftWidth: 0.5, borderLeftColor: C.line },
  cell: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  prev: { ...T.caption, ...T.num, fontSize: 11, fontWeight: '400', height: 14 },
  input:{ fontSize: 17, fontWeight: '600', ...T.num, minWidth: 44, paddingVertical: 2 },
  unitLabel: { fontSize: 9, fontWeight: '600', color: C.ink4, letterSpacing: 0.3, height: 12 },
});
