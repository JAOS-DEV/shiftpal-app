import { useTheme } from "@/providers/ThemeProvider";
import React, { useMemo } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useModals } from "../hooks/useModals";
import { useSettings } from "../hooks/useSettings";
import { AdvancedSection } from "./settings/AdvancedSection";
import { AllowancesSettingsSection } from "./settings/AllowancesSettingsSection";
import { HelpModal } from "./settings/HelpModal";
import { NightEditModal } from "./settings/NightEditModal";
import { NiSettingsSection } from "./settings/NiSettingsSection";
import { NotificationsSettingsSection } from "./settings/NotificationsSettingsSection";
import { OvertimeEditModal } from "./settings/OvertimeEditModal";
import { PayPeriodSettingsSection } from "./settings/PayPeriodSettingsSection";
import { PayRatesSection } from "./settings/PayRatesSection";
import { PayRulesSummarySection } from "./settings/PayRulesSummarySection";
import { PreferencesSection } from "./settings/PreferencesSection";
import { TaxSettingsSection } from "./settings/TaxSettingsSection";
import { WeekendEditModal } from "./settings/WeekendEditModal";
import { WeekStartPickerModal } from "./settings/WeekStartPickerModal";
import { styles } from "./SettingsPage.styles";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function SettingsPage(): React.JSX.Element {
  const { colors } = useTheme();
  const { settings, refreshSettings } = useSettings();
  const {
    showOvertimeSheet,
    showNightSheet,
    showWeekendSheet,
    showWeekStartPicker,
    helpModal,
    openModal,
    closeModal,
    openHelpModal,
    closeHelpModal,
  } = useModals();

  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );

  const openHelp = (title: string, body: string): void =>
    openHelpModal(title, body);

  const closeHelp = (): void => closeHelpModal();

  return (
    <ThemedView style={styles.container}>
      {/* Modals */}
      <HelpModal
        visible={helpModal.visible}
        title={helpModal.title}
        body={helpModal.body}
        onClose={closeHelp}
      />
      <OvertimeEditModal
        visible={showOvertimeSheet}
        settings={settings}
        onClose={() => closeModal("showOvertimeSheet")}
        onSettingsChange={refreshSettings}
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

      <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
        Settings
      </ThemedText>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pay Settings Section */}
          <ThemedText
            style={[styles.sectionHeader, { color: colors.textSecondary }]}
          >
            PAY SETTINGS
          </ThemedText>
          <PayRatesSection
            payRates={settings?.payRates || []}
            onRatesChange={refreshSettings}
            currencySymbol={currencySymbol}
          />
          <PayRulesSummarySection
            payRules={settings?.payRules}
            currencySymbol={currencySymbol}
            onEditOvertime={() => openModal("showOvertimeSheet")}
            onEditNight={() => openModal("showNightSheet")}
            onEditWeekend={() => openModal("showWeekendSheet")}
            onEditWeekStart={() => openModal("showWeekStartPicker")}
            onHelp={openHelp}
          />
          <PayPeriodSettingsSection
            key={`${settings?.payRules?.payPeriod?.cycle || "weekly"}`}
            payPeriod={settings?.payRules?.payPeriod}
            onOpenWeekStartPicker={() => openModal("showWeekStartPicker")}
            onSettingsChange={refreshSettings}
          />
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

          {/* Preferences Section */}
          <ThemedText
            style={[styles.sectionHeader, { color: colors.textSecondary }]}
          >
            PREFERENCES
          </ThemedText>
          <PreferencesSection
            settings={settings}
            currencySymbol={currencySymbol}
            onSettingsChange={refreshSettings}
          />

          {/* Notifications Section */}
          <ThemedText
            style={[styles.sectionHeader, { color: colors.textSecondary }]}
          >
            NOTIFICATIONS
          </ThemedText>
          <NotificationsSettingsSection
            notifications={settings?.notifications}
            onSettingsChange={refreshSettings}
          />

          {/* Advanced Section */}
          <ThemedText
            style={[styles.sectionHeader, { color: colors.textSecondary }]}
          >
            ADVANCED
          </ThemedText>
          <AdvancedSection
            settings={settings}
            onSettingsChange={refreshSettings}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
