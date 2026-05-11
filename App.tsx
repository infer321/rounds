import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import PatientScreen from './screens/PatientScreen';
import SignoutScreen from './screens/SignoutScreen';
import SettingsScreen from './screens/SettingsScreen';
import { PatientsProvider } from './context/PatientsContext';

export type RootStackParamList = {
  Home: undefined;
  Patient: { patientId: string };
  Signout: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PatientsProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Patient" component={PatientScreen} />
          <Stack.Screen name="Signout" component={SignoutScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PatientsProvider>
  );
}
