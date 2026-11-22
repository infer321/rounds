/**
 * KeyboardAccessory — floating number/symbol row above the keyboard.
 *
 * Works in Expo managed workflow (no native build needed).
 * Listens to Keyboard events, renders an absolutely-positioned bar just
 * above the keyboard.  Pressing the bar's buttons does NOT blur the
 * active TextInput on iOS (Views don't steal first-responder status).
 */
import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Keyboard, Platform, KeyboardEvent,
} from 'react-native';
import { useKbCtx, useKbState } from '../context/KeyboardContext';
import { C } from '../theme';

// kept as named export so other files don't need changes
export const TOOLBAR_ID = 'rounds-toolbar';

const KEYS = ['1','2','3','4','5','6','7','8','9','0'];
export const TOOLBAR_HEIGHT = 50; // total height of the number row bar

export default function KeyboardAccessory() {
  const { doInsert } = useKbCtx();
  const { suggestions, extraKeys, toolbarActive } = useKbState();
  const [kbHeight, setKbHeight] = useState(0);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvt, (e: KeyboardEvent) => {
      setKbHeight(e.endCoordinates.height);
      setVisible(true);
    });
    const onHide = Keyboard.addListener(hideEvt, () => setVisible(false));
    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  if (!visible || !toolbarActive) return null;

  return (
    // pointerEvents="box-none" so the transparent area above doesn't
    // eat touches; the inner rows use the default "auto".
    <View style={[st.root, { bottom: kbHeight }]} pointerEvents="box-none">

      {/* ── Autocomplete suggestion chips ── */}
      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          style={st.suggBar}
          contentContainerStyle={st.suggContent}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          pointerEvents="auto"
        >
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={st.chip} onPress={() => doInsert(s.insert, s.replaceFrom)}>
              <Text style={st.chipText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Number / symbol row ── */}
      <View style={st.numRow} pointerEvents="auto">
        {[...KEYS, ...extraKeys].map(k => (
          <TouchableOpacity key={k} style={st.key} onPress={() => doInsert(k)}>
            <Text style={st.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}

const st = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#D3D5DA',
  },
  suggBar: {
    backgroundColor: '#E8EBEF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C0C5CC',
  },
  suggContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: '#C5C9D0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  numRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 7,
    gap: 4,
  },
  key: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingVertical: 9,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 1 },
  },
  keyText: {
    fontSize: 16,
    fontWeight: '500',
    color: C.ink,
  },
});
