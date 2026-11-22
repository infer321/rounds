import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Labs } from '../data/patients';

const STROKE = '#555';
const SW = 1.5;
const BORDER = '#E0E0E0';

// ─── Reference ranges ─────────────────────────────────────────
const RANGES: Record<keyof Labs, [number, number]> = {
  wbc: [4.5,  11.0],
  hgb: [12.0, 17.5],
  hct: [35,   52],
  plt: [150,  400],
  na:  [136,  145],
  k:   [3.5,  5.0],
  cl:  [98,   106],
  co2: [22,   29],
  bun: [7,    20],
  cr:  [0.6,  1.2],
  glu: [70,   100],
  // LFT / CMP
  ca:  [8.5,  10.5],
  po4: [2.5,  4.5],
  tp:  [6.0,  8.3],
  alb: [3.5,  5.0],
  ast: [10,   40],
  alt: [7,    56],
  ldh: [140,  280],
  ap:  [44,   147],
  bili:[0.1,  1.2],
};

// Max input length per field
const MAX_LEN: Partial<Record<keyof Labs, number>> = {
  wbc: 4, hgb: 4, k: 3, cr: 4,
  hct: 2, plt: 3, na: 3, cl: 3, co2: 2, bun: 2, glu: 3,
  ca: 4, po4: 3, tp: 3, alb: 3,
  ast: 3, alt: 3, ldh: 3, ap: 3, bili: 4,
};

function valueColor(val: string, lo: number, hi: number): string {
  const n = parseFloat(val);
  if (!val || isNaN(n)) return '#1C1C1E';
  if (n > hi) return '#E24B4A';
  if (n < lo) return '#2471A3';
  return '#1C1C1E';
}

function prevValueColor(val: string, lo: number, hi: number): string {
  const n = parseFloat(val);
  if (!val || isNaN(n)) return '#AAAAAA';
  if (n > hi) return '#D97F7E';
  if (n < lo) return '#7AAEC8';
  return '#AAAAAA';
}

// ─── Cell ─────────────────────────────────────────────────────
function Cell({
  labKey, label, value, prevValue, onChange, inputRef, onNext, isLast, style,
}: {
  labKey: keyof Labs;
  label: string;
  value: string;
  prevValue?: string;
  onChange: (v: string) => void;
  inputRef: (r: TextInput | null) => void;
  onNext: () => void;
  isLast: boolean;
  style?: object;
}) {
  const [lo, hi] = RANGES[labKey];
  const localRef = useRef<TextInput>(null);

  return (
    <Pressable
      style={[styles.cell, style]}
      onPress={() => localRef.current?.focus()}
    >
      {!!prevValue && (
        <Text style={[styles.prevValue, { color: prevValueColor(prevValue, lo, hi) }]}>
          {prevValue}
        </Text>
      )}
      <Text style={styles.cellLabel}>{label}</Text>
      <TextInput
        ref={r => { (localRef as any).current = r; inputRef(r); }}
        style={[styles.cellInput, { color: valueColor(value, lo, hi) }]}
        value={value}
        onChangeText={t => { if (/^\d*\.?\d?$/.test(t)) onChange(t); }}
        keyboardType="decimal-pad"
        returnKeyType={isLast ? 'done' : 'next'}
        onSubmitEditing={isLast ? undefined : onNext}
        placeholder="—"
        placeholderTextColor="#CCC"
        textAlign="center"
        selectTextOnFocus
        blurOnSubmit={isLast}
        maxLength={MAX_LEN[labKey] ?? 5}
      />
    </Pressable>
  );
}

// ─── CBC fishbone ─────────────────────────────────────────────
//
//   \       Hgb       /
//    X ────────────── X
//   /       HCT       \
//  WBC               Plts
//
const CBC_H = 160;

type FishProps = {
  labs: Labs;
  prevLabs?: Labs;
  labRefs: React.MutableRefObject<Partial<Record<keyof Labs, TextInput | null>>>;
  patchLab: (k: keyof Labs, v: string) => void;
  advance: (k: keyof Labs) => void;
};

export function CBCFishbone({ labs, prevLabs, labRefs, patchLab, advance }: FishProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const cx1       = w * 0.28;
  const cx2       = w * 0.72;
  const cy        = CBC_H / 2;
  const wingInset = w * 0.04;
  const wing2     = w - wingInset;
  const wingTop   = 14;
  const wingBot   = CBC_H - 14;

  const lc = (key: keyof Labs, label: string, style: object) => (
    <Cell labKey={key} label={label}
      value={labs[key] ?? ''}
      prevValue={prevLabs?.[key]}
      onChange={v => patchLab(key, v)}
      inputRef={r => { labRefs.current[key] = r; }}
      onNext={() => advance(key)}
      isLast={false}
      style={style} />
  );

  return (
    <View style={[styles.diagramBox, { height: CBC_H }]} onLayout={onLayout}>
      {w > 0 && (
        <>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Line x1={cx1} y1={cy} x2={cx2} y2={cy} stroke={STROKE} strokeWidth={SW} />
            <Line x1={wingInset} y1={wingTop} x2={cx1} y2={cy} stroke={STROKE} strokeWidth={SW} />
            <Line x1={wingInset} y1={wingBot} x2={cx1} y2={cy} stroke={STROKE} strokeWidth={SW} />
            <Line x1={cx2} y1={cy} x2={wing2} y2={wingTop} stroke={STROKE} strokeWidth={SW} />
            <Line x1={cx2} y1={cy} x2={wing2} y2={wingBot} stroke={STROKE} strokeWidth={SW} />
          </Svg>

          {lc('wbc', 'WBC',  { position: 'absolute', left: 0,   top: 0,  width: cx1,       height: CBC_H })}
          {lc('hgb', 'Hgb',  { position: 'absolute', left: cx1, top: 0,  width: cx2 - cx1, height: cy })}
          {lc('hct', 'HCT',  { position: 'absolute', left: cx1, top: cy, width: cx2 - cx1, height: CBC_H - cy })}
          {lc('plt', 'Plts', { position: 'absolute', right: 0,  top: 0,  width: w - cx2,   height: CBC_H })}
        </>
      )}
    </View>
  );
}

// ─── BMP fishbone ─────────────────────────────────────────────
//
//   Na⁺  |  Cl⁻  |  BUN  \
//   ──────────────────────  > Glu
//   K⁺   | HCO₃  |   Cr  /
//
const BMP_H = 160;

export function BMPFishbone({ labs, prevLabs, labRefs, patchLab, advance }: FishProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const cy       = BMP_H / 2;
  const tailX    = w * 0.74;
  const v1       = w * 0.27;
  const v2       = w * 0.52;
  const vTop     = 12;
  const vBot     = BMP_H - 12;
  const tailOutX = w * 0.95;

  const lc = (key: keyof Labs, label: string, style: object) => (
    <Cell labKey={key} label={label}
      value={labs[key] ?? ''}
      prevValue={prevLabs?.[key]}
      onChange={v => patchLab(key, v)}
      inputRef={r => { labRefs.current[key] = r; }}
      onNext={() => advance(key)}
      isLast={false}
      style={style} />
  );

  return (
    <View style={[styles.diagramBox, { height: BMP_H }]} onLayout={onLayout}>
      {w > 0 && (
        <>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Line x1={0}     y1={cy}   x2={tailX}    y2={cy}        stroke={STROKE} strokeWidth={SW} />
            <Line x1={v1}    y1={vTop} x2={v1}       y2={vBot}      stroke={STROKE} strokeWidth={SW} />
            <Line x1={v2}    y1={vTop} x2={v2}       y2={vBot}      stroke={STROKE} strokeWidth={SW} />
            <Line x1={tailX} y1={cy}   x2={tailOutX} y2={8}         stroke={STROKE} strokeWidth={SW} />
            <Line x1={tailX} y1={cy}   x2={tailOutX} y2={BMP_H - 8} stroke={STROKE} strokeWidth={SW} />
          </Svg>

          {lc('na',  'Na⁺',  { position: 'absolute', left: 0,   top: 0,  width: v1,         height: cy })}
          {lc('k',   'K⁺',   { position: 'absolute', left: 0,   top: cy, width: v1,         height: BMP_H - cy })}
          {lc('cl',  'Cl⁻',  { position: 'absolute', left: v1,  top: 0,  width: v2 - v1,    height: cy })}
          {lc('co2', 'HCO₃', { position: 'absolute', left: v1,  top: cy, width: v2 - v1,    height: BMP_H - cy })}
          {lc('bun', 'BUN',  { position: 'absolute', left: v2,  top: 0,  width: tailX - v2, height: cy })}
          {lc('cr',  'Cr',   { position: 'absolute', left: v2,  top: cy, width: tailX - v2, height: BMP_H - cy })}
          {lc('glu', 'Glu',  { position: 'absolute', left: tailX, top: 0, width: w - tailX, height: BMP_H })}
        </>
      )}
    </View>
  );
}

// ─── LFT / CMP fishbone ───────────────────────────────────────
//
//   Ca  |  TP  |  AST  |  LDH  \
//   ─────────────────────────────> Bili
//   PO₄ |  Alb |  ALT  |  AP   /
//
const LFT_H = 160;

export function LFTFishbone({ labs, prevLabs, labRefs, patchLab, advance }: FishProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const cy       = LFT_H / 2;
  const v1       = w * 0.21;
  const v2       = w * 0.42;
  const v3       = w * 0.63;
  const tailX    = w * 0.80;
  const vTop     = 12;
  const vBot     = LFT_H - 12;
  const tailOutX = w * 0.95;

  const lc = (key: keyof Labs, label: string, style: object) => (
    <Cell labKey={key} label={label}
      value={labs[key] ?? ''}
      prevValue={prevLabs?.[key]}
      onChange={v => patchLab(key, v)}
      inputRef={r => { labRefs.current[key] = r; }}
      onNext={() => advance(key)}
      isLast={key === 'bili'}
      style={style} />
  );

  return (
    <View style={[styles.diagramBox, { height: LFT_H }]} onLayout={onLayout}>
      {w > 0 && (
        <>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Line x1={0}     y1={cy}   x2={tailX}    y2={cy}         stroke={STROKE} strokeWidth={SW} />
            <Line x1={v1}    y1={vTop} x2={v1}        y2={vBot}      stroke={STROKE} strokeWidth={SW} />
            <Line x1={v2}    y1={vTop} x2={v2}        y2={vBot}      stroke={STROKE} strokeWidth={SW} />
            <Line x1={v3}    y1={vTop} x2={v3}        y2={vBot}      stroke={STROKE} strokeWidth={SW} />
            <Line x1={tailX} y1={cy}   x2={tailOutX}  y2={8}         stroke={STROKE} strokeWidth={SW} />
            <Line x1={tailX} y1={cy}   x2={tailOutX}  y2={LFT_H - 8} stroke={STROKE} strokeWidth={SW} />
          </Svg>

          {lc('ca',  'Ca',   { position: 'absolute', left: 0,   top: 0,  width: v1,         height: cy })}
          {lc('po4', 'PO₄',  { position: 'absolute', left: 0,   top: cy, width: v1,         height: LFT_H - cy })}
          {lc('tp',  'TP',   { position: 'absolute', left: v1,  top: 0,  width: v2 - v1,    height: cy })}
          {lc('alb', 'Alb',  { position: 'absolute', left: v1,  top: cy, width: v2 - v1,    height: LFT_H - cy })}
          {lc('ast', 'AST',  { position: 'absolute', left: v2,  top: 0,  width: v3 - v2,    height: cy })}
          {lc('alt', 'ALT',  { position: 'absolute', left: v2,  top: cy, width: v3 - v2,    height: LFT_H - cy })}
          {lc('ldh', 'LDH',  { position: 'absolute', left: v3,  top: 0,  width: tailX - v3, height: cy })}
          {lc('ap',  'AP',   { position: 'absolute', left: v3,  top: cy, width: tailX - v3, height: LFT_H - cy })}
          {lc('bili','Bili', { position: 'absolute', left: tailX, top: 0, width: w - tailX, height: LFT_H })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  diagramBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  prevValue: {
    fontSize: 12,
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
    marginBottom: 3,
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  cellInput: {
    fontSize: 19,
    fontWeight: '700',
    width: '100%',
    paddingVertical: 0,
  },
});
