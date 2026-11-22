import { View, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import PatientScreen from './screens/PatientScreen';
import SignoutScreen from './screens/SignoutScreen';
import SettingsScreen from './screens/SettingsScreen';
import PresetsScreen from './screens/PresetsScreen';
import ExamBuilderScreen from './screens/ExamBuilderScreen';
import ROSBuilderScreen from './screens/ROSBuilderScreen';
import PresentScreen from './screens/PresentScreen';
import PhrasesScreen from './screens/PhrasesScreen';
import { SettingsProvider } from './context/SettingsContext';
import { PatientsProvider } from './context/PatientsContext';
import { KeyboardProvider } from './context/KeyboardContext';
import { ToastProvider } from './context/ToastContext';
import KeyboardAccessory from './components/KeyboardAccessory';
import AuthGate from './components/AuthGate';
import { C, palette } from './theme';

export type RootStackParamList = {
  Home: undefined;
  Patient: { patientId: string; tab?: 'timers' | 'hp' | 'soap' | 'eye' };
  Present: { patientId: string };
  Phrases: undefined;
  Signout: undefined;
  Settings: undefined;
  Presets: undefined;
  ExamBuilder: { patientId: string };
  ROSBuilder: { patientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const scheme = useColorScheme();
  const pal = palette(scheme);
  const navTheme = { ...DefaultTheme, dark: scheme === 'dark', colors: { ...DefaultTheme.colors, background: pal.bg, card: pal.surface, text: pal.ink, border: pal.line } };
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthGate>
          <KeyboardProvider>
            <PatientsProvider>
              <ToastProvider>
                <View style={{ flex: 1 }}>
                  <NavigationContainer theme={navTheme}>
                    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
                      <Stack.Screen name="Home" component={HomeScreen} />
                      <Stack.Screen name="Patient" component={PatientScreen} />
                      <Stack.Screen name="Signout" component={SignoutScreen} />
                      <Stack.Screen name="Settings" component={SettingsScreen} />
                      <Stack.Screen name="Presets" component={PresetsScreen} />
                      <Stack.Screen name="ExamBuilder" component={ExamBuilderScreen} />
                      <Stack.Screen name="ROSBuilder" component={ROSBuilderScreen} />
                      <Stack.Screen name="Present" component={PresentScreen} />
                      <Stack.Screen name="Phrases" component={PhrasesScreen} />
                    </Stack.Navigator>
                  </NavigationContainer>
                  <KeyboardAccessory />
                </View>
              </ToastProvider>
            </PatientsProvider>
          </KeyboardProvider>
        </AuthGate>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
