import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ThemeProvider as CustomThemeProvider } from "@/providers/ThemeProvider";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

import { useColorScheme } from "@/hooks/useColorScheme";

// Custom toast configuration with transparency
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#4CAF50',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        backgroundColor: 'transparent',
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
      }}
      text2Style={{
        fontSize: 14,
        color: '#666',
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#F44336',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        backgroundColor: 'transparent',
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
      }}
      text2Style={{
        fontSize: 14,
        color: '#666',
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#2196F3',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        backgroundColor: 'transparent',
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
      }}
      text2Style={{
        fontSize: 14,
        color: '#666',
      }}
    />
  ),
  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#FF9800',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        backgroundColor: 'transparent',
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
      }}
      text2Style={{
        fontSize: 14,
        color: '#666',
      }}
    />
  ),
};

function RootNavigator() {
  const { user, initializing } = useAuth();
  useProtectedRoute(user, initializing);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <CustomThemeProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="auto" />
          <Toast 
            config={toastConfig}
            position="top" 
            topOffset={80}
            visibilityTime={3000}
          />
        </AuthProvider>
      </ThemeProvider>
    </CustomThemeProvider>
  );
}
