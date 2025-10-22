import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { PayPeriodConfig } from "@/types/settings";
import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Dropdown } from "../Dropdown";
import { ThemedText } from "../ThemedText";

interface PayPeriodSettingsSectionProps {
  payPeriod: PayPeriodConfig | undefined;
  onOpenWeekStartPicker: () => void;
  onSettingsChange: () => void;
}

export const PayPeriodSettingsSection: React.FC<
  PayPeriodSettingsSectionProps
> = ({ payPeriod, onOpenWeekStartPicker, onSettingsChange }) => {
  const { colors } = useTheme();

  // Initialize state from props, but never update from props to avoid interfering with user input
  const [cycle, setCycle] = useState<PayPeriodConfig["cycle"]>(
    payPeriod?.cycle || "weekly"
  );
  const [startDate, setStartDate] = useState(
    payPeriod?.startDate?.toString() || "1"
  );

  const updatePayPeriod = async (
    updates: Partial<PayPeriodConfig>
  ): Promise<void> => {
    await settingsService.setPayRules({
      payPeriod: {
        cycle: "weekly",
        startDate: 1,
        ...payPeriod,
        ...updates,
      },
    });
    onSettingsChange();
  };

  const handleCycleChange = async (
    value: PayPeriodConfig["cycle"]
  ): Promise<void> => {
    setCycle(value);

    if (value === "monthly") {
      // When switching to monthly, initialize startDate with prop value if available
      if (payPeriod?.startDate) {
        setStartDate(payPeriod.startDate.toString());
      }
      await updatePayPeriod({ cycle: value });
    } else if (value === "weekly") {
      // When switching to weekly, reset monthly start date to default
      setStartDate("1");
      await updatePayPeriod({ cycle: value, startDate: 1 });
    } else {
      await updatePayPeriod({ cycle: value });
    }
  };

  const handleStartDateChange = async (value: string): Promise<void> => {
    setStartDate(value);
    const numValue = parseInt(value) || 1;
    await updatePayPeriod({ startDate: numValue });
  };

  const getCurrentPeriodPreview = (): string => {
    const startDay = parseInt(startDate) || 1;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let periodStart: Date;
    let periodEnd: Date;

    if (currentDay >= startDay) {
      // We're in the current month's period
      periodStart = new Date(currentYear, currentMonth, startDay);
      periodEnd = new Date(currentYear, currentMonth + 1, startDay - 1);
    } else {
      // We're in the previous month's period
      periodStart = new Date(currentYear, currentMonth - 1, startDay);
      periodEnd = new Date(currentYear, currentMonth, startDay - 1);
    }

    const startStr = periodStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = periodEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${startStr} - ${endStr}`;
  };

  const getCycleOptions = () => {
    return [
      { value: "weekly", label: "Weekly" },
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

        {cycle === "weekly" && (
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
              <ThemedText
                style={[styles.inputSuffix, { color: colors.textSecondary }]}
              >
                (1-31)
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.inputDescription, { color: colors.textSecondary }]}
            >
              Day of the month when pay period starts
            </ThemedText>
            {startDate && parseInt(startDate) > 0 && (
              <ThemedText
                style={[styles.periodPreview, { color: colors.textSecondary }]}
              >
                Current period: {getCurrentPeriodPreview()}
              </ThemedText>
            )}
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
  periodPreview: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
});
