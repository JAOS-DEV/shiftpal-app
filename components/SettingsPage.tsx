import { useTheme } from "@/providers/ThemeProvider";
import React, { useMemo, useState } from "react";
import { useModals } from "../hooks/useModals";
import { useSettings } from "../hooks/useSettings";
import { AdvancedSection } from "./settings/AdvancedSection";
import { HelpModal } from "./settings/HelpModal";
import { NightEditModal } from "./settings/NightEditModal";
import { OvertimeEditModal } from "./settings/OvertimeEditModal";
import { PayRatesSection } from "./settings/PayRatesSection";
import { PayRulesSummarySection } from "./settings/PayRulesSummarySection";
import { PreferencesSection } from "./settings/PreferencesSection";
import { WeekendEditModal } from "./settings/WeekendEditModal";
import { WeekStartPickerModal } from "./settings/WeekStartPickerModal";
import { styles } from "./SettingsPage.styles";
import { TabSwitcher } from "./TabSwitcher";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function SettingsPage(): JSX.Element {
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
  
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "pay" | "preferences" | "advanced"
  >("pay");

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
            currencySymbol={currencySymbol}
          />
        </>
      )}

      {/* Preferences Tab */}
      {activeSettingsTab === "preferences" && (
        <PreferencesSection
          settings={settings}
          currencySymbol={currencySymbol}
          onOpenWeekStartPicker={() => openModal("showWeekStartPicker")}
          onSettingsChange={refreshSettings}
        />
      )}

      {/* Advanced Tab */}
      {activeSettingsTab === "advanced" && (
        <AdvancedSection settings={settings} onSettingsChange={refreshSettings} />
      )}
    </ThemedView>
  );
}
