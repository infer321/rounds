import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ITEM_H = 48;
const VISIBLE = 5; // odd number so center item is obvious
const PAD = ITEM_H * Math.floor(VISIBLE / 2);

const HOURS = Array.from({ length: 73 }, (_, i) => i);     // 0–72
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10...55

type Props = {
  hours: number;
  minutes: number;
  onHoursChange: (h: number) => void;
  onMinutesChange: (m: number) => void;
};

function Column({
  items, selected, onChange, label,
}: {
  items: number[];
  selected: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const ref = useRef<ScrollView>(null);
  const idx = items.indexOf(selected);

  useEffect(() => {
    if (idx >= 0) {
      setTimeout(() => ref.current?.scrollTo({ y: idx * ITEM_H, animated: false }), 50);
    }
  }, []);

  return (
    <View style={styles.column}>
      {/* selection highlight */}
      <View style={styles.highlight} pointerEvents="none" />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: PAD, paddingBottom: PAD }}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const clamped = Math.max(0, Math.min(i, items.length - 1));
          onChange(items[clamped]);
        }}
      >
        {items.map(v => (
          <View key={v} style={styles.item}>
            <Text style={[styles.itemText, v === selected && styles.itemSelected]}>
              {String(v).padStart(2, '0')}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.colLabel}>{label}</Text>
    </View>
  );
}

export default function DurationPicker({ hours, minutes, onHoursChange, onMinutesChange }: Props) {
  return (
    <View style={styles.picker}>
      <Column items={HOURS} selected={hours} onChange={onHoursChange} label="hr" />
      <Text style={styles.colon}>:</Text>
      <Column items={MINUTES} selected={minutes} onChange={onMinutesChange} label="min" />
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_H * VISIBLE,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  column: {
    flex: 1,
    height: ITEM_H * VISIBLE,
    position: 'relative',
  },
  scroll: {
    width: '100%',
  },
  highlight: {
    position: 'absolute',
    top: PAD,
    left: 8,
    right: 8,
    height: ITEM_H,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    zIndex: 0,
  },
  item: {
    height: ITEM_H,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 22,
    color: '#AAA',
    fontVariant: ['tabular-nums'],
  },
  itemSelected: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  colLabel: {
    position: 'absolute',
    bottom: 6,
    fontSize: 11,
    color: '#999',
  },
  colon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#999',
    marginBottom: 16,
  },
});
