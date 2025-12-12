import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { Preferences } from "@/types/settings";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function AccountSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { settings, refreshSettings } = useSettings();
  const { signOutUser } = useAuth();
  const insets = useSafeAreaInsets();

  const updatePreferences = async (
    updates: Partial<Preferences>
  ): Promise<void> => {
    await settingsService.setPreferences(updates);
    refreshSettings();
  };

  const handleSignOut = (): void => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOutUser,
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60,
            ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.container,
              Platform.OS === "web" && {
                width: "100%",
                maxWidth: 1200,
                alignSelf: "center",
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol
                  name="chevron.left"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <ThemedText
                type="title"
                style={[styles.title, { color: colors.text }]}
              >
                Account & About
              </ThemedText>
            </View>

            {/* Pay Calculation Rules */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <ThemedText
                type="subtitle"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                Pay Calculation Rules
              </ThemedText>

              <View style={styles.toggleRow}>
                <View style={styles.toggleContent}>
                  <ThemedText
                    style={[styles.toggleLabel, { color: colors.text }]}
                  >
                    Stacking
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.toggleDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Apply Night/Weekend rates on top of Base/Overtime rates
                  </ThemedText>
                </View>
                <Switch
                  value={
                    (settings?.preferences?.stackingRule || "stack") === "stack"
                  }
                  onValueChange={(val) =>
                    updatePreferences({
                      stackingRule: val ? "stack" : "highestOnly",
                    })
                  }
                />
              </View>
            </View>

            {/* Account Actions */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
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

            {/* About */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
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
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
    marginLeft: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 18,
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
