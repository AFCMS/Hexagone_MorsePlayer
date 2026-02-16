import { useEffect } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useAtom } from "jotai";

import { currentUserAtom } from "./atoms/auth";
import { onAuthChange } from "./backend/fire";
import { useCameraFlash } from "./hooks/useCameraFlash";
import { useMorseFeedback } from "./hooks/useMorseFeedback";

import { ConfigScreen } from "./screens/ConfigScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SavedMessagesScreen } from "./screens/SavedMessagesScreen";

import { ActivityIndicator, View, StyleSheet } from "react-native";

const Stack = createNativeStackNavigator();

export default function App() {
  useMorseFeedback();
  const { element: cameraFlashElement } = useCameraFlash();

  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const isAuthLoading = currentUser === undefined;

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [setCurrentUser]);

  // Show loading spinner while checking auth state
  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!currentUser) {
    return (
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator id="auth-nav">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show main app if authenticated
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {cameraFlashElement}
      <Stack.Navigator id="morse-nav">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerTitle: "Morse Player",
          }}
        />
        <Stack.Screen name="Config" component={ConfigScreen} options={{}} />
        <Stack.Screen
          name="SavedMessages"
          component={SavedMessagesScreen}
          options={{ headerTitle: "Saved Messages" }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ headerTitle: "Playback History" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
