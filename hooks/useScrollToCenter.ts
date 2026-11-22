/**
 * useScrollToCenter
 *
 * Attach scrollRef + scrollProps to a ScrollView.
 * Call centerInput(node) to explicitly re-center after the keyboard is
 * already visible (e.g. APInput new-line re-center).
 *
 * Auto-centering: fires on every `keyboardWillShow` by reading the
 * currently-focused input via TextInput.State — so every TextInput in
 * the scroll view (vitals, labs, notes, PE, etc.) gets centered with
 * zero per-input wiring.
 */
import { useRef, useEffect } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, TextInput } from 'react-native';
import { TOOLBAR_HEIGHT } from '../components/KeyboardAccessory';

export function useScrollToCenter() {
  const scrollRef   = useRef<ScrollView>(null);
  const scrollY     = useRef(0);
  const kbHeightRef = useRef(0);

  // ── Core scroll calculation ──────────────────────────────────────────────

  function doCenter(
    node: { measureInWindow: Function } | null | undefined,
    kbH: number,
    hasToolbar: boolean,
  ) {
    if (!node || !scrollRef.current) return;
    node.measureInWindow((x: number, y: number, w: number, h: number) => {
      const screenH   = Dimensions.get('window').height;
      const toolbarH  = hasToolbar ? TOOLBAR_HEIGHT : 0;
      const available = screenH - kbH - toolbarH;
      const inputMid  = y + h / 2;
      const targetMid = available / 2;
      const delta     = inputMid - targetMid;
      if (Math.abs(delta) < 24) return;           // already close enough
      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollY.current + delta),
        animated: true,
      });
    });
  }

  // ── Auto-center on keyboard appear ─────────────────────────────────────
  // keyboardWillShow fires when the keyboard appears OR changes size
  // (e.g. default → number-pad).  Reading currentlyFocusedInput() means
  // every TextInput across the whole screen is handled automatically.

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvt as any, (e: any) => {
      const kbH = e.endCoordinates.height;
      kbHeightRef.current = kbH;

      setTimeout(() => {
        // TextInput.State.currentlyFocusedInput() returns the focused node
        const focused = (TextInput.State as any).currentlyFocusedInput?.();
        if (!focused) return;

        // Toolbar shows only for text (non-numeric) keyboards. Detect by
        // measuring keyboard height: iOS number-pad is ~216 px, default is ~290+.
        // Approximate: if kbH < 250 assume numeric keyboard, no toolbar.
        const hasToolbar = kbH >= 250;
        doCenter(focused, kbH, hasToolbar);
      }, 320); // wait for keyboard animation to settle
    });

    const onHide = Keyboard.addListener(hideEvt as any, () => {
      kbHeightRef.current = 0;
    });

    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  // ── Manual re-center ───────────────────────────────────────────────────
  // Call when keyboard is already showing and you need to re-center
  // (e.g. APInput new-line, or switching fields with same keyboard type).

  function centerInput(node: { measureInWindow: Function } | null | undefined) {
    if (!node) return;
    const kbH = kbHeightRef.current;
    setTimeout(() => {
      doCenter(node, kbH, kbH >= 250);
    }, 80);
  }

  return {
    scrollRef,
    centerInput,
    scrollProps: {
      onScroll: (e: any) => { scrollY.current = e.nativeEvent.contentOffset.y; },
      scrollEventThrottle: 16 as const,
    },
  };
}
