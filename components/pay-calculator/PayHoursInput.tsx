import { useTheme } from "@/providers/ThemeProvider";
import { HoursAndMinutes } from "@/types/settings";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ui/ThemedText";

interface PayHoursInputProps {
  mode: "tracker" | "manual";
  date: string;
  trackerHours: HoursAndMinutes;
  trackerOvertime: HoursAndMinutes;
  manualHours: HoursAndMinutes;
  manualOvertime: HoursAndMinutes;
  manualNight: HoursAndMinutes;
  trackerDerivedSplit?: {
    base: HoursAndMinutes;
    overtime: HoursAndMinutes;
  } | null;
  trackerNightHint?: HoursAndMinutes | null;
  onTrackerHoursChange: (hours: HoursAndMinutes) => void;
  onTrackerOvertimeChange: (hours: HoursAndMinutes) => void;
  onManualHoursChange: (hours: HoursAndMinutes) => void;
  onManualOvertimeChange: (hours: HoursAndMinutes) => void;
  onManualNightChange: (hours: HoursAndMinutes) => void;
  // New props for conditional display
  isOverrideMode?: boolean;
  onToggleOverride?: () => void;
  onResetOverride?: () => void;
  // New props for Load from Tracker button
  hasSubmittedShifts?: boolean;
  isLoadingTrackerHours?: boolean;
  hasLoadedFromTracker?: boolean;
  onLoadFromTracker?: () => void;
  hasNightRules?: boolean;
  hasExistingCalculation?: boolean;
}

export const PayHoursInput: React.FC<PayHoursInputProps> = ({
  mode,
  date,
  trackerHours,
  trackerOvertime,
  manualHours,
  manualOvertime,
  manualNight,
  trackerDerivedSplit,
  trackerNightHint,
  onTrackerHoursChange,
  onTrackerOvertimeChange,
  onManualHoursChange,
  onManualOvertimeChange,
  onManualNightChange,
  isOverrideMode = false,
  onToggleOverride,
  onResetOverride,
  hasSubmittedShifts = false,
  isLoadingTrackerHours = false,
  hasLoadedFromTracker = false,
  onLoadFromTracker,
  hasNightRules = false,
  hasExistingCalculation = false,
}) => {
  const { colors } = useTheme();

  const formatHMClock = (hm?: HoursAndMinutes): string => {
    if (!hm) return "0:00";
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  };

  // Helper functions to handle HoursAndMinutes conversion
  const updateHours = (
    current: HoursAndMinutes,
    hours: string,
    minutes: string
  ) => {
    const newHours = Math.max(0, parseInt(hours) || 0);
    const newMinutes = Math.max(0, Math.min(59, parseInt(minutes) || 0));
    return { hours: newHours, minutes: newMinutes };
  };

  const getCurrentHours = (
    mode: "tracker" | "manual",
    type: "base" | "overtime"
  ) => {
    if (mode === "tracker") {
      return type === "base" ? trackerHours : trackerOvertime;
    } else {
      return type === "base" ? manualHours : manualOvertime;
    }
  };

  const handleHoursChange = (
    mode: "tracker" | "manual",
    type: "base" | "overtime",
    hours: string,
    minutes: string
  ) => {
    const updated = updateHours(getCurrentHours(mode, type), hours, minutes);
    if (mode === "tracker") {
      if (type === "base") {
        onTrackerHoursChange(updated);
      } else {
        onTrackerOvertimeChange(updated);
      }
    } else {
      if (type === "base") {
        onManualHoursChange(updated);
      } else {
        onManualOvertimeChange(updated);
      }
    }
  };

  const handleNightHoursChange = (hours: string, minutes: string) => {
    const updated = updateHours(manualNight, hours, minutes);
    onManualNightChange(updated);
  };

  // Check if night inputs should be shown (only when night rules are enabled)
  const showNightInputs = hasNightRules;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Hours
        </ThemedText>
        {mode === "manual" && onLoadFromTracker && (
          <TouchableOpacity
            style={[
              styles.loadButton,
              !hasSubmittedShifts && styles.loadButtonDisabled,
            ]}
            onPress={onLoadFromTracker}
            disabled={!hasSubmittedShifts || isLoadingTrackerHours}
          >
            <ThemedText
              style={[
                styles.loadButtonText,
                {
                  color: hasSubmittedShifts
                    ? hasExistingCalculation
                      ? colors.error || "#FF3B30"
                      : colors.primary
                    : colors.textSecondary,
                },
              ]}
            >
              {isLoadingTrackerHours
                ? "Loading..."
                : hasExistingCalculation
                ? "↻ Update from Tracker"
                : hasLoadedFromTracker
                ? "↻ Reload"
                : "↓ Load from Tracker"}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {!hasSubmittedShifts && mode === "manual" && (
        <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
          No submitted shifts for this date
        </ThemedText>
      )}
      <View style={styles.row}>
        <ThemedText style={[styles.rowLabel, { color: colors.text }]}>
          Standard
        </ThemedText>
        <View style={styles.inline}>
          <TextInput
            style={[
              styles.numInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={
              getCurrentHours(mode, "base").hours === 0
                ? ""
                : getCurrentHours(mode, "base").hours.toString()
            }
            onChangeText={(text) =>
              handleHoursChange(
                mode,
                "base",
                text,
                getCurrentHours(mode, "base").minutes.toString()
              )
            }
          />
          <ThemedText>h</ThemedText>
          <TextInput
            style={[
              styles.numInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={
              getCurrentHours(mode, "base").minutes === 0
                ? ""
                : getCurrentHours(mode, "base").minutes.toString()
            }
            onChangeText={(text) =>
              handleHoursChange(
                mode,
                "base",
                getCurrentHours(mode, "base").hours.toString(),
                text
              )
            }
          />
          <ThemedText>m</ThemedText>
        </View>
      </View>
      <View style={styles.row}>
        <ThemedText style={[styles.rowLabel, { color: colors.text }]}>
          Overtime
        </ThemedText>
        <View style={styles.inline}>
          <TextInput
            style={[
              styles.numInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={
              getCurrentHours(mode, "overtime").hours === 0
                ? ""
                : getCurrentHours(mode, "overtime").hours.toString()
            }
            onChangeText={(text) =>
              handleHoursChange(
                mode,
                "overtime",
                text,
                getCurrentHours(mode, "overtime").minutes.toString()
              )
            }
          />
          <ThemedText>h</ThemedText>
          <TextInput
            style={[
              styles.numInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={
              getCurrentHours(mode, "overtime").minutes === 0
                ? ""
                : getCurrentHours(mode, "overtime").minutes.toString()
            }
            onChangeText={(text) =>
              handleHoursChange(
                mode,
                "overtime",
                getCurrentHours(mode, "overtime").hours.toString(),
                text
              )
            }
          />
          <ThemedText>m</ThemedText>
        </View>
      </View>

      {showNightInputs && (
        <View style={styles.row}>
          <ThemedText style={[styles.rowLabel, { color: colors.text }]}>
            Night
          </ThemedText>
          <View style={styles.inline}>
            <TextInput
              style={[
                styles.numInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={
                manualNight.hours === 0 ? "" : manualNight.hours.toString()
              }
              onChangeText={(text) =>
                handleNightHoursChange(text, manualNight.minutes.toString())
              }
            />
            <ThemedText>h</ThemedText>
            <TextInput
              style={[
                styles.numInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={
                manualNight.minutes === 0 ? "" : manualNight.minutes.toString()
              }
              onChangeText={(text) =>
                handleNightHoursChange(manualNight.hours.toString(), text)
              }
            />
            <ThemedText>m</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    backgroundColor: "white", // Will be overridden by theme
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    marginBottom: 0,
  },
  loadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  loadButtonDisabled: {
    opacity: 0.5,
  },
  loadButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    fontStyle: "italic",
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    width: 90,
    fontWeight: "600",
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numInput: {
    width: 60,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: "center",
  },

  readOnlyContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  readOnlyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  readOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  overrideButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  overrideButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resetButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "center",
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
