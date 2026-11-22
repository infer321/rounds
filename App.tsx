import { View } from 'react-native';
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
import { SettingsProvider } from './context/SettingsContext';
import { PatientsProvider } from './context/PatientsContext';
import { KeyboardProvider } from './context/KeyboardContext';
import { ToastProvider } from './context/ToastContext';
import KeyboardAccessory from './components/KeyboardAccessory';
import AuthGate from './components/AuthGate';
import { C } from './theme';

export type RootStackParamList = {
  Home: undefined;
  Patient: { patientId: string; tab?: 'timers' | 'hp' | 'soap' };
  Signout: undefined;
  Settings: undefined;
  Presets: undefined;
  ExamBuilder: { patientId: string };
  ROSBuilder: { patientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.bg } };

export default function App() {
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
