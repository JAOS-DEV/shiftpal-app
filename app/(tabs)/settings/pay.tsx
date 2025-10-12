import { HelpModal } from "@/components/settings/HelpModal";
import { NightEditModal } from "@/components/settings/NightEditModal";
import { OvertimeEditModal } from "@/components/settings/OvertimeEditModal";
import { PayPeriodSettingsSection } from "@/components/settings/PayPeriodSettingsSection";
import { PayRatesSection } from "@/components/settings/PayRatesSection";
import { PayRulesSummarySection } from "@/components/settings/PayRulesSummarySection";
import { WeekendEditModal } from "@/components/settings/WeekendEditModal";
import { WeekStartPickerModal } from "@/components/settings/WeekStartPickerModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useModals } from "@/hooks/useModals";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
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

export default function PaySettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
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
              onEditOvertime={() => openModal("showOvertimeSheet")}
              onEditNight={() => openModal("showNightSheet")}
              onEditWeekend={() => openModal("showWeekendSheet")}
              onEditWeekStart={() => openModal("showWeekStartPicker")}
              onHelp={openHelp}
            />
            <PayPeriodSettingsSection
              payPeriod={settings?.payRules?.payPeriod}
              onOpenWeekStartPicker={() => openModal("showWeekStartPicker")}
              onSettingsChange={refreshSettings}
            />
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
});
