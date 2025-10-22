import { AllowancesSettingsSection } from "@/components/settings/AllowancesSettingsSection";
import { NiSettingsSection } from "@/components/settings/NiSettingsSection";
import { TaxSettingsSection } from "@/components/settings/TaxSettingsSection";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function DeductionsSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { settings, refreshSettings } = useSettings();
  const insets = useSafeAreaInsets();

  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ThemedView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
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
                  Deductions
                </ThemedText>
              </View>

              <TaxSettingsSection
                taxRules={settings?.payRules?.tax}
                currencySymbol={currencySymbol}
                onSettingsChange={refreshSettings}
              />
              <NiSettingsSection
                niRules={settings?.payRules?.ni}
                currencySymbol={currencySymbol}
                onSettingsChange={refreshSettings}
              />
              <AllowancesSettingsSection
                allowances={settings?.payRules?.allowances || []}
                currencySymbol={currencySymbol}
                onSettingsChange={refreshSettings}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
});
