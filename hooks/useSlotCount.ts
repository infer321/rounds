import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@rounds_slot_count';
const DEFAULT = 8;

export function useSlotCount() {
  const [slotCount, setSlotCountState] = useState(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) setSlotCountState(parseInt(v));
    });
  }, []);

  function setSlotCount(n: number) {
    const clamped = Math.min(16, Math.max(1, n));
    setSlotCountState(clamped);
    AsyncStorage.setItem(KEY, String(clamped));
  }

  return { slotCount, setSlotCount };
}
