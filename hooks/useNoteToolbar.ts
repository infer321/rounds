/**
 * Connects a multiline TextInput to the floating keyboard toolbar.
 * After a toolbar insert, the caret is put back where the insert ended
 * (React Native otherwise jumps it to the end of the text).
 */
import { RefObject, useRef } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputSelectionChangeEventData } from 'react-native';
import { useKbCtx } from '../context/KeyboardContext';

export function useNoteToolbar(value: string, onChange: (v: string) => void, inputRef?: RefObject<TextInput | null>) {
  const { registerInsert } = useKbCtx();
  const sel = useRef({ start: value.length, end: value.length });
  const val = useRef(value);
  const chg = useRef(onChange);
  val.current = value;
  chg.current = onChange;

  return {
    onFocus: () => {
      registerInsert((str: string, replaceFrom?: number) => {
        const start = replaceFrom ?? sel.current.start;
        const end = sel.current.end;
        const next = val.current.slice(0, start) + str + val.current.slice(end);
        const caret = start + str.length;
        val.current = next;
        sel.current = { start: caret, end: caret };
        chg.current(next);
        requestAnimationFrame(() => inputRef?.current?.setSelection?.(caret, caret));
      });
    },
    onBlur: () => setTimeout(() => registerInsert(null), 150),
    onSelectionChange: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      sel.current = e.nativeEvent.selection;
    },
  };
}
