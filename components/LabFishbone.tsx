import { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, LayoutChangeEvent } from 'react-native';
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
};

function valueColor(val: string, lo: number, hi: number): string {
  const n = parseFloat(val);
  if (!val || isNaN(n)) return '#1C1C1E';
  if (n > hi) return '#E24B4A';   // above → red
  if (n < lo) return '#2471A3';   // below → blue
  return '#1C1C1E';               // normal → dark
}

// ─── Fish cell ────────────────────────────────────────────────
function Cell({
  labKey, label, value, onChange, inputRef, onNext, isLast, style,
}: {
  labKey: keyof Labs;
  label: string; value: string;
  onChange: (v: string) => void;
  inputRef: (r: TextInput | null) => void;
  onNext: () => void; isLast: boolean;
  style?: object;
}) {
  const [lo, hi] = RANGES[labKey];
  const col = valueColor(value, lo, hi);

  return (
    <View style={[styles.cell, style]}>
      <Text style={styles.cellLabel}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={[styles.cellInput, { color: col }]}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        returnKeyType={isLast ? 'done' : 'next'}
        onSubmitEditing={isLast ? undefined : onNext}
        placeholder="—"
        placeholderTextColor="#CCC"
        textAlign="center"
        selectTextOnFocus
        maxLength={5}
      />
    </View>
  );
}

// ─── CBC fishbone ─────────────────────────────────────────────
//
//   \           Hgb          /
//    X ─────────────────── X
//   /           HCT          \
//  WBC                      Plts
//
const CBC_H = 160;

type CBCProps = {
  labs: Labs;
  labRefs: React.MutableRefObject<Partial<Record<keyof Labs, TextInput | null>>>;
  patchLab: (k: keyof Labs, v: string) => void;
  advance: (k: keyof Labs) => void;
};

export function CBCFishbone({ labs, labRefs, patchLab, advance }: CBCProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const cx1 = w * 0.28;
  const cx2 = w * 0.72;
  const cy  = CBC_H / 2;
  const wingInset = w * 0.04;
  const wing2 = w - wingInset;
  const wingTop = 14;
  const wingBot = CBC_H - 14;

  const lc = (key: keyof Labs, label: string, style: object) => (
    <Cell labKey={key} label={label}
      value={labs[key] ?? ''} onChange={v => patchLab(key, v)}
      inputRef={r => { labRefs.current[key] = r; }}
      onNext={() => advance(key)} isLast={key === 'plt'}
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

          {lc('wbc', 'WBC', { position: 'absolute', left: 2, top: cy - 30, width: cx1 - 6 })}
          {lc('hgb', 'Hgb', { position: 'absolute', left: cx1 + 6, top: 8, width: cx2 - cx1 - 12, alignItems: 'center' })}
          {lc('hct', 'HCT', { position: 'absolute', left: cx1 + 6, top: cy + 10, width: cx2 - cx1 - 12, alignItems: 'center' })}
          {lc('plt', 'Plts', { position: 'absolute', right: 2, top: cy - 30, width: w - cx2 - 6 })}
        </>
      )}
    </View>
  );
}

// ─── BMP fishbone ─────────────────────────────────────────────
//
//   Na⁺  |   Cl⁻  |  BUN  \
//   ──────────────────────── > Glu
//   K⁺   |  HCO₃  |   Cr  /
//
const BMP_H = 160;

type BMPProps = {
  labs: Labs;
  labRefs: React.MutableRefObject<Partial<Record<keyof Labs, TextInput | null>>>;
  patchLab: (k: keyof Labs, v: string) => void;
  advance: (k: keyof Labs) => void;
};

export function BMPFishbone({ labs, labRefs, patchLab, advance }: BMPProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const cy       = BMP_H / 2;
  const lineEnd  = w * 0.74;
  const v1       = w * 0.27;
  const v2       = w * 0.52;
  const vTop     = 12;
  const vBot     = BMP_H - 12;
  const tailX    = w * 0.74;
  const tailOutX = w * 0.95;
  const gluX     = w * 0.76;

  const lc = (key: keyof Labs, label: string, style: object) => (
    <Cell labKey={key} label={label}
      value={labs[key] ?? ''} onChange={v => patchLab(key, v)}
      inputRef={r => { labRefs.current[key] = r; }}
      onNext={() => advance(key)} isLast={key === 'glu'}
      style={style} />
  );

  return (
    <View style={[styles.diagramBox, { height: BMP_H }]} onLayout={onLayout}>
      {w > 0 && (
        <>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Line x1={0}       y1={cy}  x2={lineEnd} y2={cy}     stroke={STROKE} strokeWidth={SW} />
            <Line x1={v1}      y1={vTop} x2={v1}     y2={vBot}   stroke={STROKE} strokeWidth={SW} />
            <Line x1={v2}      y1={vTop} x2={v2}     y2={vBot}   stroke={STROKE} strokeWidth={SW} />
            <Line x1={tailX}   y1={cy}  x2={tailOutX} y2={8}     stroke={STROKE} strokeWidth={SW} />
            <Line x1={tailX}   y1={cy}  x2={tailOutX} y2={BMP_H - 8} stroke={STROKE} strokeWidth={SW} />
          </Svg>

          {lc('na',  'Na⁺',  { position: 'absolute', left: 4,       top: 6,       width: v1 - 8 })}
          {lc('k',   'K⁺',   { position: 'absolute', left: 4,       top: cy + 8,  width: v1 - 8 })}
          {lc('cl',  'Cl⁻',  { position: 'absolute', left: v1 + 4,  top: 6,       width: v2 - v1 - 8, alignItems: 'center' })}
          {lc('co2', 'HCO₃', { position: 'absolute', left: v1 + 4,  top: cy + 8,  width: v2 - v1 - 8, alignItems: 'center' })}
          {lc('bun', 'BUN',  { position: 'absolute', left: v2 + 4,  top: 6,       width: tailX - v2 - 8 })}
          {lc('cr',  'Cr',   { position: 'absolute', left: v2 + 4,  top: cy + 8,  width: tailX - v2 - 8 })}
          {lc('glu', 'Glu',  { position: 'absolute', left: gluX + 6, top: cy - 28, width: w - gluX - 10 })}
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
  cell:      { alignItems: 'flex-start' },
  cellLabel: { fontSize: 10, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1 },
  cellInput: { fontSize: 19, fontWeight: '500', width: '100%', paddingVertical: 0 },
});
