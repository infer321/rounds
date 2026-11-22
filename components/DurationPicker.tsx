/**
 * Hour/minute wheel.
 * Fixes vs. previous version:
 *  - value commits on slow drags too (onMomentumScrollEnd alone misses
 *    releases with no momentum)
 *  - wheel follows outside changes (picking a preset now moves the wheel)
 *  - live highlight + haptic tick while scrolling
 */
import { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { tap } from '../utils/haptics';
import { C, T, R } from '../theme';

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ITEM_H * Math.floor(VISIBLE / 2);
const HOURS = Array.from({ length: 73 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

type Props = { hours: number; minutes: number; onHoursChange: (h: number) => void; onMinutesChange: (m: number) => void };

function Column({ items, selected, onChange, label }: { items: number[]; selected: number; onChange: (v: number) => void; label: string }) {
  const ref = useRef<ScrollView>(null);
  const [live, setLive] = useState(selected);
  const liveRef = useRef(selected);
  const dragging = useRef(false);

  // Snap to nearest valid item when value comes from outside
  useEffect(() => {
    if (dragging.current) return;
    let idx = items.indexOf(selected);
    if (idx < 0) idx = items.reduce((b, v, i) => (Math.abs(v - selected) < Math.abs(items[b] - selected) ? i : b), 0);
    liveRef.current = items[idx];
    setLive(items[idx]);
    const t = setTimeout(() => ref.current?.scrollTo({ y: idx * ITEM_H, animated: false }), 30);
    return () => clearTimeout(t);
  }, [selected]);

  const idxAt = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragging.current = false;
    const v = items[idxAt(e)];
    if (v !== selected) onChange(v);
  };

  return (
    <View style={st.column}>
      <View style={st.highlight} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: PAD }}
        onScrollBeginDrag={() => { dragging.current = true; }}
        onScroll={e => {
          const v = items[idxAt(e)];
          if (v !== liveRef.current) { liveRef.current = v; setLive(v); tap(); }
        }}
        onScrollEndDrag={e => {
          const vy = e.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(vy) < 0.05) settle(e);   // released without fling
        }}
        onMomentumScrollEnd={settle}
      >
        {items.map(v => (
          <View key={v} style={st.item}>
            <Text style={[st.itemText, v === live && st.itemSelected]}>{String(v).padStart(2, '0')}</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={st.colLabel} pointerEvents="none">{label}</Text>
    </View>
  );
}

export default function DurationPicker({ hours, minutes, onHoursChange, onMinutesChange }: Props) {
  return (
    <View style={st.picker}>
      <Column items={HOURS} selected={hours} onChange={onHoursChange} label="hr" />
      <Text style={st.colon}>:</Text>
      <Column items={MINUTES} selected={minutes} onChange={onMinutesChange} label="min" />
    </View>
  );
}

const st = StyleSheet.create({
  picker:   { flexDirection: 'row', alignItems: 'center', height: ITEM_H * VISIBLE, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 0.5, borderColor: C.line, overflow: 'hidden' },
  column:   { flex: 1, height: ITEM_H * VISIBLE },
  highlight:{ position: 'absolute', top: PAD, left: 10, right: 10, height: ITEM_H, backgroundColor: C.sunken, borderRadius: R.sm },
  item:     { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 22, color: C.ink4, ...T.num },
  itemSelected: { color: C.ink, fontWeight: '600' },
  colLabel: { position: 'absolute', right: 18, top: PAD + 14, ...T.caption },
  colon:    { fontSize: 24, color: C.ink4, marginBottom: 4 },
});
