import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { PayPeriodConfig } from "@/types/settings";
import React, { useState } from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "../Dropdown";
import { ThemedText } from "../ThemedText";

interface PayPeriodSettingsSectionProps {
  payPeriod: PayPeriodConfig | undefined;
  onOpenWeekStartPicker: () => void;
  onSettingsChange: () => void;
}

export const PayPeriodSettingsSection: React.FC<PayPeriodSettingsSectionProps> = ({
  payPeriod,
  onOpenWeekStartPicker,
  onSettingsChange,
}) => {
  const { colors } = useTheme();
  const [cycle, setCycle] = useState<PayPeriodConfig["cycle"]>(
    payPeriod?.cycle || "weekly"
  );
  const [startDate, setStartDate] = useState(
    payPeriod?.startDate?.toString() || "1"
  );

  const updatePayPeriod = async (updates: Partial<PayPeriodConfig>): Promise<void> => {
    await settingsService.setPayRules({ 
      payPeriod: { ...payPeriod, ...updates } 
    });
    onSettingsChange();
  };

  const handleCycleChange = async (value: PayPeriodConfig["cycle"]): Promise<void> => {
    setCycle(value);
    await updatePayPeriod({ cycle: value });
  };


  const handleStartDateChange = async (value: string): Promise<void> => {
    setStartDate(value);
    const numValue = parseInt(value) || 1;
    await updatePayPeriod({ startDate: numValue });
  };


  const getCycleOptions = () => {
    return [
      { value: "weekly", label: "Weekly" },
      { value: "fortnightly", label: "Fortnightly" },
      { value: "monthly", label: "Monthly" },
    ];
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
        Pay Period Settings
      </ThemedText>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
            Pay Cycle
          </ThemedText>
          <Dropdown
            placeholder="Select cycle"
            value={cycle}
            onChange={(v) => handleCycleChange(v as PayPeriodConfig["cycle"])}
            items={getCycleOptions()}
          />
        </View>

        {(cycle === "weekly" || cycle === "fortnightly") && (
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
              Week Start Day
            </ThemedText>
            <TouchableOpacity
              style={[styles.weekStartButton, { borderColor: colors.border }]}
              onPress={onOpenWeekStartPicker}
            >
              <ThemedText style={{ color: colors.text }}>
                {payPeriod?.startDay || "Monday"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {cycle === "monthly" && (
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
              Monthly Start Date
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                value={startDate}
                onChangeText={handleStartDateChange}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
              <ThemedText style={[styles.inputSuffix, { color: colors.textSecondary }]}>
                (1-31)
              </ThemedText>
            </View>
            <ThemedText style={[styles.inputDescription, { color: colors.textSecondary }]}>
              Day of the month when pay period starts
            </ThemedText>
          </View>
        )}
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
  content: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  flex1: {
    flex: 1,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputDescription: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: "italic",
  },
  weekStartButton: {
    height: 41,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
