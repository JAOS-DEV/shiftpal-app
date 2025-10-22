import { useTheme } from "@/providers/ThemeProvider";
import { HoursAndMinutes } from "@/types/settings";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
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
}) => {
  const { colors } = useTheme();

  const formatHMClock = (hm?: HoursAndMinutes): string => {
    if (!hm) return "0:00";
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  };

  const renderTrackerHints = (): React.ReactNode => {
    if (mode !== "tracker") return null;

    const parts: string[] = [];
    if (trackerDerivedSplit) {
      parts.push(`Standard: ${formatHMClock(trackerDerivedSplit.base)}`);
      parts.push(`Overtime: ${formatHMClock(trackerDerivedSplit.overtime)}`);
    }
    if (trackerNightHint && (trackerNightHint.base || trackerNightHint.ot)) {
      const nb = trackerNightHint.base || { hours: 0, minutes: 0 };
      const no = trackerNightHint.ot || { hours: 0, minutes: 0 };
      const totalMinutes =
        Math.max(0, (nb.hours || 0) * 60 + (nb.minutes || 0)) +
        Math.max(0, (no.hours || 0) * 60 + (no.minutes || 0));
      const total = {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
      };
      parts.push(`Night uplift applied: ${formatHMClock(total)}`);
    }
    if (!parts.length) return null;

    return (
      <>
        <ThemedText style={styles.helperText}>
          Auto-fills from your shifts for the selected date when available.
        </ThemedText>
        <ThemedText style={styles.helperText}>{parts.join(" • ")}</ThemedText>
      </>
    );
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

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Hours
      </ThemedText>
      <View style={styles.row}>
        <ThemedText style={styles.rowLabel}>Standard</ThemedText>
        <View style={styles.inline}>
          <TextInput
            style={styles.numInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
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
            style={styles.numInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
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
        <ThemedText style={styles.rowLabel}>Overtime</ThemedText>
        <View style={styles.inline}>
          <TextInput
            style={styles.numInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
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
            style={styles.numInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
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
        <>
          <View style={styles.row}>
            <ThemedText style={styles.rowLabel}>Night (base)</ThemedText>
            <View style={styles.inline}>
              <TextInput
                style={styles.numInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6B7280"
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
                style={styles.numInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6B7280"
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
            <ThemedText style={styles.rowLabel}>Night (OT)</ThemedText>
            <View style={styles.inline}>
              <TextInput
                style={styles.numInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6B7280"
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
                style={styles.numInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6B7280"
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
      {renderTrackerHints()}
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
    borderColor: "#E5E5EA",
    backgroundColor: "white",
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
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: "center",
  },
  helperText: {
    marginTop: 8,
    fontStyle: "italic",
  },
});
