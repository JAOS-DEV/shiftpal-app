import { HelpModal } from "@/components/settings/HelpModal";
import { NightEditModal } from "@/components/settings/NightEditModal";
import { PayPeriodSettingsSection } from "@/components/settings/PayPeriodSettingsSection";
import { PayRatesSection } from "@/components/settings/PayRatesSection";
import { PayRulesSummarySection } from "@/components/settings/PayRulesSummarySection";
import { WeekendEditModal } from "@/components/settings/WeekendEditModal";
import { WeekStartPickerModal } from "@/components/settings/WeekStartPickerModal";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useModals } from "@/hooks/useModals";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function PaySettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { settings, refreshSettings } = useSettings();
  const {
    showNightSheet,
    showWeekendSheet,
    showWeekStartPicker,
    helpModal,
    openModal,
    closeModal,
    openHelpModal,
    closeHelpModal,
  } = useModals();
  const insets = useSafeAreaInsets();

  const [weeklyGoalText, setWeeklyGoalText] = useState("");
  const [monthlyGoalText, setMonthlyGoalText] = useState("");

  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );

  React.useEffect(() => {
    const weeklyGoal = settings?.preferences?.weeklyGoal;
    setWeeklyGoalText(
      weeklyGoal !== undefined && weeklyGoal !== null && weeklyGoal > 0
        ? String(weeklyGoal)
        : ""
    );
    const monthlyGoal = settings?.preferences?.monthlyGoal;
    setMonthlyGoalText(
      monthlyGoal !== undefined && monthlyGoal !== null && monthlyGoal > 0
        ? String(monthlyGoal)
        : ""
    );
  }, [settings]);

  const openHelp = (title: string, body: string): void =>
    openHelpModal(title, body);

  const closeHelp = (): void => closeHelpModal();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ThemedView style={{ flex: 1 }}>
        {/* Modals */}
        <HelpModal
          visible={helpModal.visible}
          title={helpModal.title}
          body={helpModal.body}
          onClose={closeHelp}
        />
        <NightEditModal
          visible={showNightSheet}
          settings={settings}
          onClose={() => closeModal("showNightSheet")}
          onSettingsChange={refreshSettings}
        />
        <WeekendEditModal
          visible={showWeekendSheet}
          settings={settings}
          onClose={() => closeModal("showWeekendSheet")}
          onSettingsChange={refreshSettings}
        />
        <WeekStartPickerModal
          visible={showWeekStartPicker}
          settings={settings}
          onClose={() => closeModal("showWeekStartPicker")}
          onSettingsChange={refreshSettings}
        />

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
            keyboardShouldPersistTaps="handled"
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
                  Pay & Rates
                </ThemedText>
              </View>

              <PayRatesSection
                payRates={settings?.payRates || []}
                onRatesChange={refreshSettings}
                currencySymbol={currencySymbol}
              />
              <PayRulesSummarySection
                payRules={settings?.payRules}
                currencySymbol={currencySymbol}
                onEditNight={() => openModal("showNightSheet")}
                onEditWeekend={() => openModal("showWeekendSheet")}
                onEditWeekStart={() => openModal("showWeekStartPicker")}
                onHelp={openHelp}
              />

              {/* Goals */}
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
                  Goals
                </ThemedText>
                <ThemedText
                  style={[
                    styles.sectionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Net totals are used. Progress appears in Pay → History for
                  Week or Month.
                </ThemedText>
                <View style={styles.goalsGroup}>
                  <View style={styles.goalField}>
                    <ThemedText
                      style={[
                        styles.inputLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Weekly goal
                    </ThemedText>
                    <TextInput
                      placeholder={`${currencySymbol}0`}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      value={weeklyGoalText}
                      onChangeText={setWeeklyGoalText}
                      onEndEditing={async () => {
                        let n = parseFloat(weeklyGoalText || "");
                        if (Number.isNaN(n)) n = 0;
                        n = Math.max(0, n);
                        setWeeklyGoalText(n > 0 ? String(n) : "");
                        await settingsService.setPreferences({
                          weeklyGoal: n,
                        });
                        refreshSettings();
                      }}
                      style={[
                        styles.input,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                    />
                  </View>
                  <View style={styles.goalField}>
                    <ThemedText
                      style={[
                        styles.inputLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Monthly goal
                    </ThemedText>
                    <TextInput
                      placeholder={`${currencySymbol}0`}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      value={monthlyGoalText}
                      onChangeText={setMonthlyGoalText}
                      onEndEditing={async () => {
                        let n = parseFloat(monthlyGoalText || "");
                        if (Number.isNaN(n)) n = 0;
                        n = Math.max(0, n);
                        setMonthlyGoalText(n > 0 ? String(n) : "");
                        await settingsService.setPreferences({
                          monthlyGoal: n,
                        });
                        refreshSettings();
                      }}
                      style={[
                        styles.input,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <PayPeriodSettingsSection
                key={`${settings?.payRules?.payPeriod?.cycle || "weekly"}`}
                payPeriod={settings?.payRules?.payPeriod}
                onOpenWeekStartPicker={() => openModal("showWeekStartPicker")}
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
    marginBottom: 16,
    fontStyle: "italic",
  },
  goalsGroup: {
    flexDirection: "row",
    gap: 8,
  },
  goalField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
