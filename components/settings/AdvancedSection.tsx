import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings } from "@/types/settings";
import React from "react";
import {
    Alert,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

interface AdvancedSectionProps {
  settings: AppSettings | null;
  onSettingsChange: () => void;
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { colors } = useTheme();
  const { signOutUser } = useAuth();

  const updatePreferences = async (updates: any): Promise<void> => {
    await settingsService.setPreferences(updates);
    onSettingsChange();
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
    <>
      {/* Advanced Settings */}
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
          Advanced
        </ThemedText>

        <View style={styles.toggleRow}>
          <ThemedText style={[styles.flex1, { color: colors.text }]}>
            Stacking (apply Night/Weekend on top of Base/OT)
          </ThemedText>
          <Switch
            value={(settings?.preferences?.stackingRule || "stack") === "stack"}
            onValueChange={(val) =>
              updatePreferences({
                stackingRule: val ? "stack" : "highestOnly",
              })
            }
          />
        </View>
      </View>

      {/* Account */}
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
    </>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 4,
  },
  flex1: {
    flex: 1,
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

