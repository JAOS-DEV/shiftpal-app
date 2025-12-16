import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "@/providers/ThemeProvider";
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

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColorScheme } from "@/hooks/useColorScheme";

// Themed toast configuration component
function ThemedToastConfig() {
  const { colors } = useTheme();

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.success,
          backgroundColor: colors.surface,
          borderRadius: 8,
          marginHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          backgroundColor: "transparent",
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: colors.error,
          backgroundColor: colors.surface,
          borderRadius: 8,
          marginHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          backgroundColor: "transparent",
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}
      />
    ),
    info: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.primary,
          backgroundColor: colors.surface,
          borderRadius: 8,
          marginHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          backgroundColor: "transparent",
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}
      />
    ),
    warning: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.warning,
          backgroundColor: colors.surface,
          borderRadius: 8,
          marginHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          backgroundColor: "transparent",
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
        }}
      />
    ),
  };

  return (
    <Toast
      config={toastConfig}
      position="top"
      topOffset={80}
      visibilityTime={3000}
    />
  );
}

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
    <ErrorBoundary>
      <CustomThemeProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AuthProvider>
            <RootNavigator />
            <StatusBar style="auto" />
            <ThemedToastConfig />
          </AuthProvider>
        </ThemeProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}
