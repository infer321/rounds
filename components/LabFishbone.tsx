/**
 * Lab fishbone diagrams drawn with react-native-svg.
 * Each diagram measures itself via onLayout, then renders
 * SVG lines + absolutely-positioned TextInputs for entry.
 */
import { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Labs } from '../data/patients';

const STROKE = '#555';
const SW = 1.5;
const LABEL_COLOR = '#888';
const VALUE_COLOR = '#1C1C1E';
const BORDER = '#E0E0E0';

// ─── shared input cell ────────────────────────────────────────
function Cell({
  label, value, onChange, inputRef, onNext, isLast,
  style,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  inputRef: (r: TextInput | null) => void;
  onNext: () => void; isLast: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.cell, style]}>
      <Text style={styles.cellLabel}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={styles.cellInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        returnKeyType={isLast ? 'done' : 'next'}
        onSubmitEditing={isLast ? undefined : onNext}
        placeholder="—"
        placeholderTextColor="#CCC"
        textAlign="center"
        selectTextOnFocus
      />
    </View>
  );
}

// ─── CBC fishbone ─────────────────────────────────────────────
//
//   \         Hb          /
//    X ───────────────── X
//   /         HCT         \
//  WBC                   Plts
//
// Left X: lines from corners of left box to center-left point
// Right X: lines from center-right point to corners of right box
// Horizontal bar connects the two center points
// Labels: WBC left, Hb above bar, HCT below bar, Plts right

const CBC_H = 160;
const CBC_ORDER: (keyof Labs)[] = ['wbc', 'hgb', 'hct', 'plt'];

type CBCProps = {
  labs: Labs;
  labRefs: React.MutableRefObject<Partial<Record<keyof Labs, TextInput | null>>>;
  patchLab: (k: keyof Labs, v: string) => void;
  advance: (k: keyof Labs) => void;
};

export function CBCFishbone({ labs, labRefs, patchLab, advance }: CBCProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  // Key x coordinates (proportional to width)
  const cx1 = w * 0.28;   // left center point (where left X converges)
  const cx2 = w * 0.72;   // right center point (where right X converges)
  const cy = CBC_H / 2;   // vertical center = horizontal bar y

  // Corners for the X wings
  const wingTop = 14;
  const wingBot = CBC_H - 14;
  const wingInset = w * 0.04;  // outer X corner x
  const wing2 = w - wingInset; // right outer X corner x

  return (
    <View style={[styles.diagramBox, { height: CBC_H }]} onLayout={onLayout}>
      {w > 0 && (
        <>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Horizontal bar */}
            <Line x1={cx1} y1={cy} x2={cx2} y2={cy} stroke={STROKE} strokeWidth={SW} />
            {/* Left X */}
            <Line x1={wingInset} y1={wingTop} x2={cx1} y2={cy} stroke={STROKE} strokeWidth={SW} />
            <Line x1={wingInset} y1={wingBot} x2={cx1} y2={cy} stroke={STROKE} strokeWidth={SW} />
            {/* Right X */}
            <Line x1={cx2} y1={cy} x2={wing2} y2={wingTop} stroke={STROKE} strokeWidth={SW} />
            <Line x1={cx2} y1={cy} x2={wing2} y2={wingBot} stroke={STROKE} strokeWidth={SW} />
          </Svg>

          {/* WBC — left, vertically centered */}
          <Cell
            label="WBC" value={labs.wbc ?? ''}
            onChange={v => patchLab('wbc', v)}
            inputRef={r => { labRefs.current.wbc = r; }}
            onNext={() => advance('wbc')} isLast={false}
            style={{ position: 'absolute', left: 0, top: cy - 30, width: cx1 - 8 }}
          />
          {/* Hb — above bar, center */}
          <Cell
            label="Hgb" value={labs.hgb ?? ''}
            onChange={v => patchLab('hgb', v)}
            inputRef={r => { labRefs.current.hgb = r; }}
            onNext={() => advance('hgb')} isLast={false}
            style={{ position: 'absolute', left: cx1 + 8, top: 6, width: cx2 - cx1 - 16, alignItems: 'center' }}
          />
          {/* HCT — below bar, center */}
          <Cell
            label="HCT" value={labs.hct ?? ''}
            onChange={v => patchLab('hct', v)}
            inputRef={r => { labRefs.current.hct = r; }}
            onNext={() => advance('hct')} isLast={false}
            style={{ position: 'absolute', left: cx1 + 8, top: cy + 10, width: cx2 - cx1 - 16, alignItems: 'center' }}
          />
          {/* Plts — right, vertically centered */}
          <Cell
            label="Plts" value={labs.plt ?? ''}
            onChange={v => patchLab('plt', v)}
            inputRef={r => { labRefs.current.plt = r; }}
            onNext={() => advance('plt')} isLast={false}
            style={{ position: 'absolute', right: 0, top: cy - 30, width: w - cx2 - 8 }}
          />
        </>
      )}
    </View>
  );
}

// ─── BMP (Chem) fishbone ──────────────────────────────────────
//
//   Na+     |    Cl-    |   BUN   \
//   ─────────────────────────────── > Glucose
//   K+      |   HCO3   |    Cr   /
//
// Two vertical crossings on the horizontal bar, fish-tail on right

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

  const cy = BMP_H / 2;
  const lineStart = 0;
  const lineEnd = w * 0.74;   // horizontal bar ends here
  // Vertical crossing positions
  const v1 = w * 0.27;
  const v2 = w * 0.52;
  const vTop = 12;
  const vBot = BMP_H - 12;
  // Fish-tail prongs
  const tailX = w * 0.74;
  const tailTopX = w * 0.95;
  const tailBot = BMP_H - 8;
  const tailTop = 8;
  // Glu label position
  const gluX = w * 0.76;

  return (
    <View style={[styles.diagramBox, { height: BMP_H }]} onLayout={onLayout}>
      {w > 0 && (
        <>
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Horizontal spine */}
            <Line x1={lineStart} y1={cy} x2={lineEnd} y2={cy} stroke={STROKE} strokeWidth={SW} />
            {/* Vertical crossing 1 */}
            <Line x1={v1} y1={vTop} x2={v1} y2={vBot} stroke={STROKE} strokeWidth={SW} />
            {/* Vertical crossing 2 */}
            <Line x1={v2} y1={vTop} x2={v2} y2={vBot} stroke={STROKE} strokeWidth={SW} />
            {/* Fish-tail upper prong */}
            <Line x1={tailX} y1={cy} x2={tailTopX} y2={tailTop} stroke={STROKE} strokeWidth={SW} />
            {/* Fish-tail lower prong */}
            <Line x1={tailX} y1={cy} x2={tailTopX} y2={tailBot} stroke={STROKE} strokeWidth={SW} />
          </Svg>

          {/* Na — top-left quadrant */}
          <Cell
            label="Na⁺" value={labs.na ?? ''}
            onChange={v => patchLab('na', v)}
            inputRef={r => { labRefs.current.na = r; }}
            onNext={() => advance('na')} isLast={false}
            style={{ position: 'absolute', left: 4, top: 6, width: v1 - 8 }}
          />
          {/* K — bottom-left quadrant */}
          <Cell
            label="K⁺" value={labs.k ?? ''}
            onChange={v => patchLab('k', v)}
            inputRef={r => { labRefs.current.k = r; }}
            onNext={() => advance('k')} isLast={false}
            style={{ position: 'absolute', left: 4, top: cy + 8, width: v1 - 8 }}
          />
          {/* Cl — top-middle */}
          <Cell
            label="Cl⁻" value={labs.cl ?? ''}
            onChange={v => patchLab('cl', v)}
            inputRef={r => { labRefs.current.cl = r; }}
            onNext={() => advance('cl')} isLast={false}
            style={{ position: 'absolute', left: v1 + 4, top: 6, width: v2 - v1 - 8, alignItems: 'center' }}
          />
          {/* CO2/HCO3 — bottom-middle */}
          <Cell
            label="HCO₃" value={labs.co2 ?? ''}
            onChange={v => patchLab('co2', v)}
            inputRef={r => { labRefs.current.co2 = r; }}
            onNext={() => advance('co2')} isLast={false}
            style={{ position: 'absolute', left: v1 + 4, top: cy + 8, width: v2 - v1 - 8, alignItems: 'center' }}
          />
          {/* BUN — top-right (between v2 and tail) */}
          <Cell
            label="BUN" value={labs.bun ?? ''}
            onChange={v => patchLab('bun', v)}
            inputRef={r => { labRefs.current.bun = r; }}
            onNext={() => advance('bun')} isLast={false}
            style={{ position: 'absolute', left: v2 + 4, top: 6, width: tailX - v2 - 8 }}
          />
          {/* Cr — bottom-right (between v2 and tail) */}
          <Cell
            label="Cr" value={labs.cr ?? ''}
            onChange={v => patchLab('cr', v)}
            inputRef={r => { labRefs.current.cr = r; }}
            onNext={() => advance('cr')} isLast={false}
            style={{ position: 'absolute', left: v2 + 4, top: cy + 8, width: tailX - v2 - 8 }}
          />
          {/* Glucose — to the right of the fish-tail */}
          <Cell
            label="Glu" value={labs.glu ?? ''}
            onChange={v => patchLab('glu', v)}
            inputRef={r => { labRefs.current.glu = r; }}
            onNext={() => advance('glu')} isLast={true}
            style={{ position: 'absolute', left: gluX + 6, top: cy - 28, width: w - gluX - 10 }}
          />
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
    marginBottom: 0,
  },
  cell: {
    alignItems: 'flex-start',
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: LABEL_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  cellInput: {
    fontSize: 19,
    fontWeight: '500',
    color: VALUE_COLOR,
    width: '100%',
    paddingVertical: 0,
  },
});
