import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ThemedText";
import { BreakDetails } from "./BreakDetails";

interface ShiftDetailsProps {
  shifts: Array<{
    start: string;
    end: string;
    durationText: string;
    durationMinutes: number;
    includeBreaks?: boolean;
    breaks?: Array<{
      start: number;
      end?: number;
      durationMinutes: number;
      note?: string;
    }>;
  }>;
  colors: {
    text: string;
    textSecondary: string;
    border: string;
  };
}

export const ShiftDetails: React.FC<ShiftDetailsProps> = ({ shifts, colors }) => {
  return (
    <>
      {shifts.map((shift, idx) => (
        <View
          key={`${shift.start}-${shift.end}-${idx}`}
          style={[
            styles.shiftRow,
            { borderColor: colors.border },
          ]}
        >
          <View style={styles.shiftRow}>
            <ThemedText style={[styles.shiftTime, { color: colors.text }]}>
              {shift.start} - {shift.end}
            </ThemedText>
            <ThemedText
              style={[styles.shiftDuration, { color: colors.textSecondary }]}
            >
              {shift.durationText} ({shift.durationMinutes} min)
            </ThemedText>
          </View>

          {typeof shift.includeBreaks === "boolean" && (
            <ThemedText
              style={[
                styles.breakStatusText,
                { color: colors.textSecondary },
              ]}
            >
              Breaks:{" "}
              {typeof shift.breakMinutes === "number" ? shift.breakMinutes : 0}m
              {typeof shift.breakCount === "number" && shift.breakCount > 0
                ? ` (${shift.breakCount})`
                : ""}
              {shift.includeBreaks ? " (included)" : " (excluded)"}
            </ThemedText>
          )}

          <BreakDetails breaks={shift.breaks || []} colors={colors} />
        </View>
      ))}
    </>
  );
};

const styles = {
  shiftRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  shiftDuration: {
    fontSize: 14,
    marginTop: 2,
  },
  breakStatusText: {
    fontSize: 12,
    marginTop: 4,
  },
};
