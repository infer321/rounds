/** Manage dot phrases (".aki" → plan template) used in the A/P box. */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Phrase } from '../utils/phrases';
import Sheet, { Btn } from '../components/Sheet';
import { Screen, ScreenHeader, Field, ui } from '../components/ui';
import Icon from '../components/Icon';
import { C, T, S } from '../theme';

export default function PhrasesScreen() {
  const { phrases, customPhrases, savePhrase, deletePhrase } = useSettings();
  const toast = useToast();
  const [editing, setEditing] = useState<Phrase | 'new' | null>(null);
  const [trigger, setTrigger] = useState('');
  const [text, setText] = useState('');

  function open(p: Phrase | 'new') {
    setTrigger(p === 'new' ? '' : p.trigger); setText(p === 'new' ? '' : p.text); setEditing(p);
  }
  function save() {
    if (!trigger.trim() || !text.trim()) return;
    const id = editing !== 'new' && editing && !editing.builtIn ? editing.id : undefined;
    savePhrase({ id, trigger, text });
    setEditing(null);
  }
  function remove(p: Phrase) {
    deletePhrase(p.id);
    toast({ message: `Removed .${p.trigger}`, onUndo: () => savePhrase({ trigger: p.trigger, text: p.text }) });
  }

  return (
    <Screen>
      <ScreenHeader title="Phrases" subtitle="Type .trigger in the A/P box"
        right={<Pressable onPress={() => open('new')} hitSlop={8} style={st.add} accessibilityLabel="New phrase"><Icon name="plus" size={18} color={C.onInk} strokeWidth={2.25} /></Pressable>} />
      <ScrollView contentContainerStyle={st.content}>
        <View style={ui.card}>
          {phrases.map((p, i) => (
            <Pressable key={p.id} onPress={() => open(p)} style={({ pressed }) => [st.row, i > 0 && st.div, pressed && { backgroundColor: C.sunken }]}>
              <View style={{ flex: 1 }}>
                <Text style={T.bodyM}>.{p.trigger}{p.builtIn ? '' : '  ·  yours'}</Text>
                <Text style={T.caption} numberOfLines={1}>{p.text.split('\n').slice(0, 2).join('  ')}</Text>
              </View>
              {customPhrases.some(c => c.id === p.id) && (
                <Pressable hitSlop={10} onPress={() => remove(p)} accessibilityLabel={`Remove .${p.trigger}`}><Icon name="trash" size={17} color={C.ink4} /></Pressable>
              )}
            </Pressable>
          ))}
        </View>
        <Text style={st.foot}>Editing a built-in saves your own copy. Phrases are templates: don't put patient details in them.</Text>
      </ScrollView>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New phrase' : 'Edit phrase'}
        footer={<><Btn label="Cancel" kind="secondary" onPress={() => setEditing(null)} /><Btn label="Save" onPress={save} disabled={!trigger.trim() || !text.trim()} flex={2} /></>}>
        <Field value={trigger} onChangeText={setTrigger} placeholder="Trigger, e.g. hypoK" autoCapitalize="none" autoCorrect={false} />
        <Field value={text} onChangeText={setText} placeholder={'# Hypokalemia\n- Replete K, goal >4\n- Check Mg'} multiline
          style={st.textArea} textAlignVertical="top" />
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: S.lg, paddingBottom: 60 },
  add:  { width: 34, height: 34, borderRadius: 17, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  row:  { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 12 },
  div:  { borderTopWidth: 0.5, borderTopColor: C.line },
  foot: { ...T.caption, fontWeight: '400', marginTop: S.md, marginHorizontal: 4, lineHeight: 17 },
  textArea: { marginTop: S.sm, minHeight: 160, lineHeight: 21 },
});
