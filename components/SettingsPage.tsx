import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function SettingsPage() {
  const { themeMode, setThemeMode, colors } = useTheme();
  const { signOutUser } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOutUser,
      },
    ]);
  };

  const getThemeButtonStyle = (mode: "light" | "dark" | "system") => [
    styles.themeButton,
    themeMode === mode && { backgroundColor: colors.primary },
  ];

  const getThemeTextStyle = (mode: "light" | "dark" | "system") => [
    styles.themeButtonText,
    themeMode === mode && { color: "white" },
  ];

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
        Settings
      </ThemedText>

      {/* Theme Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Appearance
        </ThemedText>

        <View style={styles.themeOptions}>
          <TouchableOpacity
            style={getThemeButtonStyle("light")}
            onPress={() => setThemeMode("light")}
            accessibilityLabel="Light theme"
          >
            <ThemedText style={getThemeTextStyle("light")}>☀️ Light</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={getThemeButtonStyle("dark")}
            onPress={() => setThemeMode("dark")}
            accessibilityLabel="Dark theme"
          >
            <ThemedText style={getThemeTextStyle("dark")}>🌙 Dark</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={getThemeButtonStyle("system")}
            onPress={() => setThemeMode("system")}
            accessibilityLabel="System theme"
          >
            <ThemedText style={getThemeTextStyle("system")}>
              📱 System
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          Current:{" "}
          {themeMode === "system"
            ? "System Default"
            : themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
        </ThemedText>
      </View>

      {/* Account Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Account
        </ThemedText>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.error }]}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
        >
          <ThemedText
            style={[styles.actionButtonText, { color: colors.error }]}
          >
            Sign Out
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          About
        </ThemedText>

        <View style={styles.infoRow}>
          <ThemedText
            style={[styles.infoLabel, { color: colors.textSecondary }]}
          >
            App Version
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: colors.text }]}>
            1.0.0
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText
            style={[styles.infoLabel, { color: colors.textSecondary }]}
          >
            Build
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: colors.text }]}>
            Development
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  themeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    // Remove any potential pointerEvents issues
    pointerEvents: "auto",
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
});
