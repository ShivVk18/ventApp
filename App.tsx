import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context" 

import WelcomeScreen from "./src/screens/index"
import Dashboardscreen from "./src/screens/dashboard-screen"
import Listener from "./src/screens/listener"
import SessionEnd from "./src/screens/session-end"
import Vent from "./src/screens/vent"
import VoiceCall from "./src/screens/voice-call"
import { AuthProvider } from "./context/AuthContext"

const Stack = createNativeStackNavigator()

const StacknNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="WelcomeScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="Dashboard" component={Dashboardscreen} />
      <Stack.Screen name="Listener" component={Listener} />
      <Stack.Screen name="Vent" component={Vent} />
      <Stack.Screen name="VoiceCall" component={VoiceCall} />
      <Stack.Screen name="SessionEnd" component={SessionEnd} />
    </Stack.Navigator>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StacknNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  )
}

export default App
