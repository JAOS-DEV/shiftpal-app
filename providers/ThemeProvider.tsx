import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    success: string;
    error: string;
    warning: string;
  };
}

const THEME_STORAGE_KEY = "theme_mode";

const lightColors = {
  background: "#F8F8F8",
  surface: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  border: "#E5E5EA",
  primary: "#007AFF",
  success: "#34C759",
  error: "#FF3B30",
  warning: "#FF9500",
};

const darkColors = {
  background: "#000000",
  surface: "#1C1C1E",
  card: "#2C2C2E",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  border: "#38383A",
  primary: "#0A84FF",
  success: "#30D158",
  error: "#FF453A",
  warning: "#FF9F0A",
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading theme preference:", error);
        setIsInitialized(true);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (themeMode === "system") {
      return systemColorScheme === "dark";
    }
    return themeMode === "dark";
  }, [themeMode, systemColorScheme]);

  // Get current colors based on theme
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      isDark,
      setThemeMode,
      colors,
    }),
    [themeMode, isDark, colors]
  );

  // Don't render until theme is initialized to prevent hydration issues
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
