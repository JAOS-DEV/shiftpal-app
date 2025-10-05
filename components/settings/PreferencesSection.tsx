import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings } from "@/types/settings";
import React, { useState } from "react";
import {
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "../Dropdown";
import { ThemedText } from "../ThemedText";

interface PreferencesSectionProps {
  settings: AppSettings | null;
  currencySymbol: string;
  onOpenWeekStartPicker: () => void;
  onSettingsChange: () => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  settings,
  currencySymbol,
  onOpenWeekStartPicker,
  onSettingsChange,
}) => {
  const { themeMode, setThemeMode, colors } = useTheme();
  const [weeklyGoalText, setWeeklyGoalText] = useState("");
  const [monthlyGoalText, setMonthlyGoalText] = useState("");

  React.useEffect(() => {
    setWeeklyGoalText(
      settings?.preferences?.weeklyGoal !== undefined &&
        settings?.preferences?.weeklyGoal !== null
        ? String(settings?.preferences?.weeklyGoal)
        : ""
    );
    setMonthlyGoalText(
      settings?.preferences?.monthlyGoal !== undefined &&
        settings?.preferences?.monthlyGoal !== null
        ? String(settings?.preferences?.monthlyGoal)
        : ""
    );
  }, [settings]);

  const updatePreferences = async (updates: any): Promise<void> => {
    await settingsService.setPreferences(updates);
    onSettingsChange();
  };

  return (
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
        Preferences
      </ThemedText>
      <ThemedText
        style={[styles.subsectionTitle, { color: colors.textSecondary }]}
      >
        Dark mode
      </ThemedText>
      <View style={[styles.toggleRow, styles.topMargin]}>
        <ThemedText style={[styles.flex1, { color: colors.text }]}>
          Enable dark mode
        </ThemedText>
        <Switch
          value={themeMode === "dark"}
          onValueChange={(val) => setThemeMode(val ? "dark" : "light")}
        />
      </View>
      <View style={[styles.inlineInputs, styles.mediumMargin]}>
        <Dropdown
          compact
          placeholder="Currency"
          value={settings?.preferences?.currency || "GBP"}
          onChange={(v) => updatePreferences({ currency: v as any })}
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
          onChange={(v) => updatePreferences({ timeFormat: v as any })}
          items={[
            { value: "24h", label: "24-hour" },
            { value: "12h", label: "12-hour" },
          ]}
        />
      </View>

      {/* Week Start Day */}
      <View style={[styles.toggleRow, styles.largeMargin]}>
        <ThemedText style={[styles.flex1, { color: colors.text }]}>
          Start Week On
        </ThemedText>
        <TouchableOpacity
          style={[styles.smallButton, { borderColor: colors.border }]}
          onPress={onOpenWeekStartPicker}
        >
          <ThemedText style={{ color: colors.text }}>
            {settings?.payRules?.payPeriod?.startDay || "Monday"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Goals */}
      <View style={styles.goalsGroup}>
        <ThemedText
          style={[styles.subsectionTitle, { color: colors.textSecondary }]}
        >
          Goals
        </ThemedText>
        <ThemedText
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          Net totals are used. Progress appears in Pay → History for Week or
          Month.
        </ThemedText>
        <View style={styles.inlineInputs}>
          <View style={styles.goalField}>
            <ThemedText
              style={[styles.inputLabel, { color: colors.textSecondary }]}
            >
              Weekly goal
            </ThemedText>
            <TextInput
              placeholder={`${currencySymbol}`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={weeklyGoalText}
              onChangeText={setWeeklyGoalText}
              onEndEditing={async () => {
                let n = parseFloat(weeklyGoalText || "");
                if (Number.isNaN(n)) n = 0;
                n = Math.max(0, n);
                setWeeklyGoalText(String(n));
                const next = await settingsService.setPreferences({
                  weeklyGoal: n,
                });
                onSettingsChange();
              }}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
          </View>
          <View style={styles.goalField}>
            <ThemedText
              style={[styles.inputLabel, { color: colors.textSecondary }]}
            >
              Monthly goal
            </ThemedText>
            <TextInput
              placeholder={`${currencySymbol}`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={monthlyGoalText}
              onChangeText={setMonthlyGoalText}
              onEndEditing={async () => {
                let n = parseFloat(monthlyGoalText || "");
                if (Number.isNaN(n)) n = 0;
                n = Math.max(0, n);
                setMonthlyGoalText(String(n));
                const next = await settingsService.setPreferences({
                  monthlyGoal: n,
                });
                onSettingsChange();
              }}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topMargin: {
    marginTop: 4,
  },
  mediumMargin: {
    marginTop: 12,
  },
  largeMargin: {
    marginTop: 16,
  },
  inlineInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  smallButton: {
    height: 41,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  goalsGroup: {
    marginTop: 12,
    gap: 6,
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
  flex1: {
    flex: 1,
  },
});

