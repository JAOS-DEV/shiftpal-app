import { useTheme } from "@/providers/ThemeProvider";
import { HoursAndMinutes } from "@/types/settings";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface PayHoursInputProps {
  mode: "tracker" | "manual";
  date: string;
  trackerHours: HoursAndMinutes;
  trackerOvertime: HoursAndMinutes;
  manualHours: HoursAndMinutes;
  manualOvertime: HoursAndMinutes;
  manualNightBase: HoursAndMinutes;
  manualNightOt: HoursAndMinutes;
  trackerDerivedSplit?: {
    base: HoursAndMinutes;
    overtime: HoursAndMinutes;
  } | null;
  trackerNightHint?: {
    base?: HoursAndMinutes;
    ot?: HoursAndMinutes;
  } | null;
  onTrackerHoursChange: (hours: HoursAndMinutes) => void;
  onTrackerOvertimeChange: (hours: HoursAndMinutes) => void;
  onManualHoursChange: (hours: HoursAndMinutes) => void;
  onManualOvertimeChange: (hours: HoursAndMinutes) => void;
  onManualNightBaseChange: (hours: HoursAndMinutes) => void;
  onManualNightOtChange: (hours: HoursAndMinutes) => void;
  // New props for conditional display
  hasOvertimeRules?: boolean;
  isOverrideMode?: boolean;
  onToggleOverride?: () => void;
  onResetOverride?: () => void;
}

export const PayHoursInput: React.FC<PayHoursInputProps> = ({
  mode,
  date,
  trackerHours,
  trackerOvertime,
  manualHours,
  manualOvertime,
  manualNightBase,
  manualNightOt,
  trackerDerivedSplit,
  trackerNightHint,
  onTrackerHoursChange,
  onTrackerOvertimeChange,
  onManualHoursChange,
  onManualOvertimeChange,
  onManualNightBaseChange,
  onManualNightOtChange,
  hasOvertimeRules = false,
  isOverrideMode = false,
  onToggleOverride,
  onResetOverride,
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

  const getCurrentNightHours = (type: "base" | "overtime") => {
    return type === "base" ? manualNightBase : manualNightOt;
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

  const handleNightHoursChange = (
    type: "base" | "overtime",
    hours: string,
    minutes: string
  ) => {
    const updated = updateHours(getCurrentNightHours(type), hours, minutes);
    if (type === "base") {
      onManualNightBaseChange(updated);
    } else {
      onManualNightOtChange(updated);
    }
  };

  // Check if night inputs should be shown (when night rules are enabled)
  const showNightInputs = mode === "manual"; // For now, only show in manual mode

  // Render read-only display when overtime rules are configured and not in override mode
  const renderReadOnlyDisplay = () => {
    if (mode !== "tracker" || !hasOvertimeRules || isOverrideMode) return null;

    return (
      <View
        style={[
          styles.readOnlyContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <ThemedText style={[styles.readOnlyTitle, { color: colors.text }]}>
          Auto-calculated from your shifts
        </ThemedText>
        <View style={styles.readOnlyRow}>
          <ThemedText
            style={[styles.readOnlyLabel, { color: colors.textSecondary }]}
          >
            Standard:
          </ThemedText>
          <ThemedText style={[styles.readOnlyValue, { color: colors.text }]}>
            {formatHMClock(trackerDerivedSplit?.base || trackerHours)}
          </ThemedText>
        </View>
        <View style={styles.readOnlyRow}>
          <ThemedText
            style={[styles.readOnlyLabel, { color: colors.textSecondary }]}
          >
            Overtime:
          </ThemedText>
          <ThemedText style={[styles.readOnlyValue, { color: colors.text }]}>
            {formatHMClock(trackerDerivedSplit?.overtime || trackerOvertime)}
          </ThemedText>
        </View>
        {trackerNightHint && (trackerNightHint.base || trackerNightHint.ot) && (
          <View style={styles.readOnlyRow}>
            <ThemedText
              style={[styles.readOnlyLabel, { color: colors.textSecondary }]}
            >
              Night uplift:
            </ThemedText>
            <ThemedText style={[styles.readOnlyValue, { color: colors.text }]}>
              {formatHMClock({
                hours:
                  (trackerNightHint.base?.hours || 0) +
                  (trackerNightHint.ot?.hours || 0),
                minutes:
                  ((trackerNightHint.base?.minutes || 0) +
                    (trackerNightHint.ot?.minutes || 0)) %
                  60,
              })}
            </ThemedText>
          </View>
        )}
        <TouchableOpacity
          style={[styles.overrideButton, { borderColor: colors.primary }]}
          onPress={onToggleOverride}
        >
          <ThemedText
            style={[styles.overrideButtonText, { color: colors.primary }]}
          >
            Override
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Hours
      </ThemedText>

      {renderReadOnlyDisplay()}

      {/* Only show input fields when not in read-only mode */}
      {!(mode === "tracker" && hasOvertimeRules && !isOverrideMode) && (
        <>
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

          {/* Reset button when in override mode */}
          {mode === "tracker" &&
            hasOvertimeRules &&
            isOverrideMode &&
            onResetOverride && (
              <TouchableOpacity
                style={[styles.resetButton, { borderColor: colors.primary }]}
                onPress={onResetOverride}
              >
                <ThemedText
                  style={[styles.resetButtonText, { color: colors.primary }]}
                >
                  Reset to Auto-calculated
                </ThemedText>
              </TouchableOpacity>
            )}

          {showNightInputs && (
            <>
              <View style={styles.row}>
                <ThemedText style={[styles.rowLabel, { color: colors.text }]}>
                  Night (base)
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
                      getCurrentNightHours("base").hours === 0
                        ? ""
                        : getCurrentNightHours("base").hours.toString()
                    }
                    onChangeText={(text) =>
                      handleNightHoursChange(
                        "base",
                        text,
                        getCurrentNightHours("base").minutes.toString()
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
                      getCurrentNightHours("base").minutes === 0
                        ? ""
                        : getCurrentNightHours("base").minutes.toString()
                    }
                    onChangeText={(text) =>
                      handleNightHoursChange(
                        "base",
                        getCurrentNightHours("base").hours.toString(),
                        text
                      )
                    }
                  />
                  <ThemedText>m</ThemedText>
                </View>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.rowLabel, { color: colors.text }]}>
                  Night (OT)
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
                      getCurrentNightHours("overtime").hours === 0
                        ? ""
                        : getCurrentNightHours("overtime").hours.toString()
                    }
                    onChangeText={(text) =>
                      handleNightHoursChange(
                        "overtime",
                        text,
                        getCurrentNightHours("overtime").minutes.toString()
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
                      getCurrentNightHours("overtime").minutes === 0
                        ? ""
                        : getCurrentNightHours("overtime").minutes.toString()
                    }
                    onChangeText={(text) =>
                      handleNightHoursChange(
                        "overtime",
                        getCurrentNightHours("overtime").hours.toString(),
                        text
                      )
                    }
                  />
                  <ThemedText>m</ThemedText>
                </View>
              </View>
            </>
          )}
        </>
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
  cardTitle: {
    marginBottom: 12,
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
