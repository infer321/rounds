import { useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Labs, PanelKey, Patient } from '../../data/patients';
import { usePatients } from '../../context/PatientsContext';
import { LAB_ORDER, LabKey, PANELS } from '../../utils/clinical';
import { parseLabs } from '../../utils/labParse';
import { useToast } from '../../context/ToastContext';
import { success, warn } from '../../utils/haptics';
import { CBCFishbone, BMPFishbone, LFTFishbone, LabRow } from '../LabFishbone';
import NoteField from './NoteField';
import { Section, SmallBtn } from './Section';
import { C, T, S } from '../../theme';

const NO_LABS: Labs = {};
type Panel = Exclude<PanelKey, 'vitals'>;

type Props = {
  patient: Patient;
  onAdvance: (p: PanelKey) => void;
  onTrends: () => void;
  onFocusField: (n: TextInput | null) => void;
};

export default function LabsSection({ patient, onAdvance, onTrends, onFocusField }: Props) {
  const { patchHP } = usePatients();
  const toast = useToast();
  const refs = useRef<Partial<Record<LabKey, TextInput | null>>>({});
  const hp = patient.hp ?? {};
  const labs = hp.labs ?? NO_LABS;
  const pid = patient.id;

  const fish = {
    labs,
    prevLabs: hp.prevLabs ?? NO_LABS,
    labRefs: refs,
    patchLab: (k: LabKey, v: string) => patchHP(pid, h => ({ ...h, labs: { ...h.labs, [k]: v } })),
    advance: (k: LabKey) => refs.current[LAB_ORDER[LAB_ORDER.indexOf(k) + 1]]?.focus(),
  };

  async function paste() {
    const text = await Clipboard.getStringAsync();
    const { labs: found, count } = parseLabs(text ?? '');
    if (!count) {
      warn();
      toast({ message: 'No labs found on the clipboard. Copy the lab results from the EMR first.' });
      return;
    }
    const before = hp.labs;
    patchHP(pid, h => ({ ...h, labs: { ...h.labs, ...found } }));
    success();
    toast({ message: `Filled ${count} lab${count === 1 ? '' : 's'} from clipboard`, onUndo: () => patchHP(pid, { labs: before }) });
  }

  const head = (title: string, panel?: Panel) => (
    <View style={st.head}>
      <Text style={st.title}>{title}</Text>
      {panel && <SmallBtn label="Advance" onPress={() => onAdvance(panel)} disabled={!PANELS[panel].some(k => labs[k])} />}
    </View>
  );

  return (
    <Section title="Labs" action={
      <View style={st.actions}>
        <SmallBtn label="Paste" icon="paste" onPress={paste} />
        <SmallBtn label="Trends" icon="trend" onPress={onTrends} />
      </View>
    }>
      <View style={{ gap: S.lg }}>
        <View>{head('CBC', 'cbc')}<CBCFishbone {...fish} /></View>
        <View>{head('BMP', 'bmp')}<BMPFishbone {...fish} /></View>
        <View>{head('CMP / LFT', 'lft')}<LFTFishbone {...fish} /></View>
        <View>{head('Mg / Coags', 'coag')}<LabRow {...fish} keys={PANELS.coag} /></View>
        <View>
          {head('Other')}
          <NoteField value={hp.otherLabs ?? ''} onCommit={v => patchHP(pid, { otherLabs: v })}
            placeholder="Lactate 2.1, trop <6, BNP 840, BCx NGTD…" minHeight={48} onFocused={onFocusField} />
        </View>
      </View>
    </Section>
  );
}

const st = StyleSheet.create({
  actions: { flexDirection: 'row', gap: S.sm },
  head:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, minHeight: 24 },
  title: { ...T.caption, color: C.ink2 },
});
