import { Dropdown } from "@/components/ui/Dropdown";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { Preferences } from "@/types/settings";
import { useRouter } from "expo-router";
import React from "react";
import {
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

export default function AppearanceSettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const router = useRouter();
  const { settings, refreshSettings } = useSettings();
  const insets = useSafeAreaInsets();

  const updatePreferences = async (
    updates: Partial<Preferences>
  ): Promise<void> => {
    await settingsService.setPreferences(updates);
    refreshSettings();
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
                Appearance
              </ThemedText>
            </View>

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
                Display Settings
              </ThemedText>

              {/* Dark Mode */}
              <View style={styles.toggleRow}>
                <ThemedText style={[styles.flex1, { color: colors.text }]}>
                  Dark mode
                </ThemedText>
                <Switch
                  value={themeMode === "dark"}
                  onValueChange={(val) => setThemeMode(val ? "dark" : "light")}
                />
              </View>

              {/* Currency and Time Format */}
              <View style={[styles.inlineInputs, styles.mediumMargin]}>
                <Dropdown
                  compact
                  placeholder="Currency"
                  value={settings?.preferences?.currency || "GBP"}
                  onChange={(v) =>
                    updatePreferences({
                      currency: v as Preferences["currency"],
                    })
                  }
                  items={[
                    { value: "GBP", label: "GBP (£)" },
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                  ]}
                />
                <Dropdown
                  compact
                  placeholder="Time format"
                  value={settings?.preferences?.timeFormat || "24h"}
                  onChange={(v) =>
                    updatePreferences({
                      timeFormat: v as Preferences["timeFormat"],
                    })
                  }
                  items={[
                    { value: "24h", label: "24-hour" },
                    { value: "12h", label: "12-hour" },
                  ]}
                />
              </View>

              {/* Date Format */}
              <View style={[styles.toggleRow, styles.mediumMargin]}>
                <ThemedText style={[styles.flex1, { color: colors.text }]}>
                  Date Format
                </ThemedText>
                <Dropdown
                  compact
                  placeholder="Date format"
                  value={settings?.preferences?.dateFormat || "DD/MM/YYYY"}
                  onChange={(v) =>
                    updatePreferences({
                      dateFormat: v as Preferences["dateFormat"],
                    })
                  }
                  items={[
                    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  ]}
                />
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
  },
  mediumMargin: {
    marginTop: 12,
  },
  inlineInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  flex1: {
    flex: 1,
  },
});
