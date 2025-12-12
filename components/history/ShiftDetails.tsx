import { useSettings } from "@/hooks/useSettings";
import { formatTime } from "@/utils/formatUtils";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ui/ThemedText";
import { BreakDetails } from "./BreakDetails";

interface ShiftDetailsProps {
  shifts: Array<{
    start: string;
    end: string;
    durationText: string;
    durationMinutes: number;
    note?: string;
    includeBreaks?: boolean;
    breakMinutes?: number;
    breakCount?: number;
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

export const ShiftDetails: React.FC<ShiftDetailsProps> = ({
  shifts,
  colors,
}) => {
  const { settings } = useSettings();

  return (
    <>
      {shifts.map((shift, idx) => (
        <View
          key={`${shift.start}-${shift.end}-${idx}`}
          style={[
            styles.shiftRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ThemedText style={[styles.shiftTime, { color: colors.text }]}>
            {formatTime(shift.start, settings)} -{" "}
            {formatTime(shift.end, settings)}
          </ThemedText>
          <ThemedText
            style={[styles.shiftDuration, { color: colors.textSecondary }]}
          >
            {shift.durationText} ({shift.durationMinutes} min)
          </ThemedText>

          {typeof shift.includeBreaks === "boolean" && (
            <ThemedText
              style={[styles.breakStatusText, { color: colors.text }]}
            >
              Breaks:{" "}
              {typeof shift.breakMinutes === "number" ? shift.breakMinutes : 0}m
              {typeof shift.breakCount === "number" && shift.breakCount > 0
                ? ` (${shift.breakCount})`
                : ""}
              {shift.includeBreaks ? " (included)" : " (excluded)"}
            </ThemedText>
          )}

          {shift.note && (
            <View
              style={[styles.noteContainer, { borderTopColor: colors.border }]}
            >
              <ThemedText style={[styles.noteText, { color: colors.text }]}>
                <ThemedText style={[styles.noteLabel, { color: colors.text }]}>
                  Note:{" "}
                </ThemedText>
                {shift.note}
              </ThemedText>
            </View>
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
    backgroundColor: "white", // Will be overridden by theme
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
    fontWeight: "600" as const,
  },
  noteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA", // Will be overridden by theme
  },
  noteText: {
    fontSize: 13,
    fontStyle: "italic" as const,
    opacity: 0.7,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontStyle: "italic" as const,
  },
};
