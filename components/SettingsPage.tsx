import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings } from "@/types/settings";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { AdvancedSection } from "./settings/AdvancedSection";
import { HelpModal } from "./settings/HelpModal";
import { NightEditModal } from "./settings/NightEditModal";
import { OvertimeEditModal } from "./settings/OvertimeEditModal";
import { PayRatesSection } from "./settings/PayRatesSection";
import { PayRulesSummarySection } from "./settings/PayRulesSummarySection";
import { PreferencesSection } from "./settings/PreferencesSection";
import { WeekendEditModal } from "./settings/WeekendEditModal";
import { WeekStartPickerModal } from "./settings/WeekStartPickerModal";
import { TabSwitcher } from "./TabSwitcher";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function SettingsPage(): JSX.Element {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "pay" | "preferences" | "advanced"
  >("pay");

  // Modal visibility states
  const [showOvertimeSheet, setShowOvertimeSheet] = useState(false);
  const [showNightSheet, setShowNightSheet] = useState(false);
  const [showWeekendSheet, setShowWeekendSheet] = useState(false);
  const [showWeekStartPicker, setShowWeekStartPicker] = useState(false);
  const [helpModal, setHelpModal] = useState<{
    visible: boolean;
    title: string;
    body: string;
  }>({ visible: false, title: "", body: "" });

  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    const s = await settingsService.getSettings();
    setSettings(s);
  };

  const openHelp = (title: string, body: string): void =>
    setHelpModal({ visible: true, title, body });

  const closeHelp = (): void =>
    setHelpModal({ visible: false, title: "", body: "" });

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
        onClose={() => setShowOvertimeSheet(false)}
        onSettingsChange={loadSettings}
      />
      <NightEditModal
        visible={showNightSheet}
        settings={settings}
        onClose={() => setShowNightSheet(false)}
        onSettingsChange={loadSettings}
      />
      <WeekendEditModal
        visible={showWeekendSheet}
        settings={settings}
        onClose={() => setShowWeekendSheet(false)}
        onSettingsChange={loadSettings}
      />
      <WeekStartPickerModal
        visible={showWeekStartPicker}
        settings={settings}
        onClose={() => setShowWeekStartPicker(false)}
        onSettingsChange={loadSettings}
      />

      <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
        Settings
      </ThemedText>
      <TabSwitcher
        tabs={[
          { key: "pay", label: "Pay" },
          { key: "preferences", label: "Preferences" },
          { key: "advanced", label: "Advanced" },
        ]}
        activeKey={activeSettingsTab}
        onKeyChange={(k) => setActiveSettingsTab(k as any)}
      />

      {/* Pay Tab */}
      {activeSettingsTab === "pay" && (
        <>
          <PayRatesSection
            payRates={settings?.payRates || []}
            onRatesChange={loadSettings}
            currencySymbol={currencySymbol}
          />
          <PayRulesSummarySection
            payRules={settings?.payRules}
            currencySymbol={currencySymbol}
            onEditOvertime={() => setShowOvertimeSheet(true)}
            onEditNight={() => setShowNightSheet(true)}
            onEditWeekend={() => setShowWeekendSheet(true)}
          />
        </>
      )}

      {/* Preferences Tab */}
      {activeSettingsTab === "preferences" && (
        <PreferencesSection
          settings={settings}
          currencySymbol={currencySymbol}
          onOpenWeekStartPicker={() => setShowWeekStartPicker(true)}
          onSettingsChange={loadSettings}
        />
      )}

      {/* Advanced Tab */}
      {activeSettingsTab === "advanced" && (
        <AdvancedSection settings={settings} onSettingsChange={loadSettings} />
      )}
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
});
