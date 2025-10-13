import { useTheme } from "@/providers/ThemeProvider";
import { HoursAndMinutes } from "@/types/settings";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface PayHoursInputProps {
  workedHours: string;
  workedMinutes: string;
  overtimeHours: string;
  overtimeMinutes: string;
  nightBaseHours?: string;
  nightBaseMinutes?: string;
  nightOvertimeHours?: string;
  nightOvertimeMinutes?: string;
  showNightInputs: boolean;
  trackerMode: boolean;
  trackerHint?: {
    split?: { base: HoursAndMinutes; overtime: HoursAndMinutes } | null;
    night?: { base?: HoursAndMinutes; ot?: HoursAndMinutes } | null;
  };
  onWorkedHoursChange: (text: string) => void;
  onWorkedMinutesChange: (text: string) => void;
  onOvertimeHoursChange: (text: string) => void;
  onOvertimeMinutesChange: (text: string) => void;
  onNightBaseHoursChange?: (text: string) => void;
  onNightBaseMinutesChange?: (text: string) => void;
  onNightOvertimeHoursChange?: (text: string) => void;
  onNightOvertimeMinutesChange?: (text: string) => void;
}

export const PayHoursInput: React.FC<PayHoursInputProps> = ({
  workedHours,
  workedMinutes,
  overtimeHours,
  overtimeMinutes,
  nightBaseHours,
  nightBaseMinutes,
  nightOvertimeHours,
  nightOvertimeMinutes,
  showNightInputs,
  trackerMode,
  trackerHint,
  onWorkedHoursChange,
  onWorkedMinutesChange,
  onOvertimeHoursChange,
  onOvertimeMinutesChange,
  onNightBaseHoursChange,
  onNightBaseMinutesChange,
  onNightOvertimeHoursChange,
  onNightOvertimeMinutesChange,
}) => {
  const { colors } = useTheme();

  const formatHMClock = (hm?: HoursAndMinutes): string => {
    if (!hm) return "0:00";
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  };

  const renderTrackerHints = (): React.ReactNode => {
    if (!trackerMode) return null;

    const parts: string[] = [];
    if (trackerHint?.split) {
      parts.push(`Standard: ${formatHMClock(trackerHint.split.base)}`);
      parts.push(`Overtime: ${formatHMClock(trackerHint.split.overtime)}`);
    }
    if (
      trackerHint?.night &&
      (trackerHint.night.base || trackerHint.night.ot)
    ) {
      const nb = trackerHint.night.base || { hours: 0, minutes: 0 };
      const no = trackerHint.night.ot || { hours: 0, minutes: 0 };
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
            value={workedHours}
            onChangeText={onWorkedHoursChange}
          />
          <ThemedText>h</ThemedText>
          <TextInput
            style={styles.numInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
            value={workedMinutes}
            onChangeText={onWorkedMinutesChange}
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
            value={overtimeHours}
            onChangeText={onOvertimeHoursChange}
          />
          <ThemedText>h</ThemedText>
          <TextInput
            style={styles.numInput}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#6B7280"
            value={overtimeMinutes}
            onChangeText={onOvertimeMinutesChange}
          />
          <ThemedText>m</ThemedText>
        </View>
      </View>
      {showNightInputs &&
        onNightBaseHoursChange &&
        onNightBaseMinutesChange && (
          <>
            <View style={styles.row}>
              <ThemedText style={styles.rowLabel}>Night (base)</ThemedText>
              <View style={styles.inline}>
                <TextInput
                  style={styles.numInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  value={nightBaseHours}
                  onChangeText={onNightBaseHoursChange}
                />
                <ThemedText>h</ThemedText>
                <TextInput
                  style={styles.numInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  value={nightBaseMinutes}
                  onChangeText={onNightBaseMinutesChange}
                />
                <ThemedText>m</ThemedText>
              </View>
            </View>
            {onNightOvertimeHoursChange && onNightOvertimeMinutesChange && (
              <View style={styles.row}>
                <ThemedText style={styles.rowLabel}>Night (OT)</ThemedText>
                <View style={styles.inline}>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={nightOvertimeHours}
                    onChangeText={onNightOvertimeHoursChange}
                  />
                  <ThemedText>h</ThemedText>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={nightOvertimeMinutes}
                    onChangeText={onNightOvertimeMinutesChange}
                  />
                  <ThemedText>m</ThemedText>
                </View>
              </View>
            )}
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
