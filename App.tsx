import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import PatientScreen from './screens/PatientScreen';
import SignoutScreen from './screens/SignoutScreen';
import SettingsScreen from './screens/SettingsScreen';
import PresetsScreen from './screens/PresetsScreen';
import ExamBuilderScreen from './screens/ExamBuilderScreen';
import ROSBuilderScreen from './screens/ROSBuilderScreen';
import { PatientsProvider } from './context/PatientsContext';
import { KeyboardProvider } from './context/KeyboardContext';
import KeyboardAccessory from './components/KeyboardAccessory';
import AuthGate from './components/AuthGate';

export type RootStackParamList = {
  Home: undefined;
  Patient: { patientId: string };
  Signout: undefined;
  Settings: undefined;
  Presets: undefined;
  ExamBuilder: { patientId: string };
  ROSBuilder:  { patientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthGate>
      <KeyboardProvider>
        {/*
          The outer View gives KeyboardAccessory a positioned ancestor so
          its `position: absolute, bottom: kbHeight` lands correctly on screen.
        */}
        <View style={{ flex: 1 }}>
          <PatientsProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home"        component={HomeScreen} />
                <Stack.Screen name="Patient"     component={PatientScreen} />
                <Stack.Screen name="Signout"     component={SignoutScreen} />
                <Stack.Screen name="Settings"    component={SettingsScreen} />
                <Stack.Screen name="Presets"     component={PresetsScreen} />
                <Stack.Screen name="ExamBuilder" component={ExamBuilderScreen} />
                <Stack.Screen name="ROSBuilder"  component={ROSBuilderScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </PatientsProvider>

          {/* Floats above every keyboard — no native build needed */}
          <KeyboardAccessory />
        </View>
      </KeyboardProvider>
    </AuthGate>
  );
}
