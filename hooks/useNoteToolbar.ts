/**
 * useNoteToolbar
 *
 * Spread onto any multiline TextInput to connect it to the floating
 * keyboard toolbar (KeyboardAccessory).
 *
 * Usage:
 *   const tb = useNoteToolbar(local.hpi ?? '', v => patch({ hpi: v }));
 *   <TextInput {...tb} ... />
 */
import { useRef } from 'react';
import { NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native';
import { useKbCtx } from '../context/KeyboardContext';

export function useNoteToolbar(value: string, onChange: (v: string) => void) {
  const { registerInsert } = useKbCtx();

  const selRef = useRef({ start: 0, end: 0 });
  const valRef = useRef(value);
  const chgRef = useRef(onChange);
  valRef.current = value;
  chgRef.current = onChange;

  return {
    onFocus: () => {
      registerInsert((str: string, replaceFrom?: number) => {
        const sel = selRef.current;
        const start = replaceFrom !== undefined ? replaceFrom : sel.start;
        const end   = sel.end;
        const v = valRef.current;
        const newVal = v.slice(0, start) + str + v.slice(end);
        chgRef.current(newVal);
        selRef.current = { start: start + str.length, end: start + str.length };
      });
    },

    // Small delay: lets any toolbar onPress fire before the handler clears
    onBlur: () => setTimeout(() => registerInsert(null), 150),

    onSelectionChange: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      selRef.current = e.nativeEvent.selection;
    },
  };
}
