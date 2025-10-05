import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ThemedText";

interface BreakDetailsProps {
  breaks: Array<{
    start: number;
    end?: number;
    durationMinutes: number;
    note?: string;
  }>;
  colors: {
    text: string;
    textSecondary: string;
    border: string;
  };
}

export const BreakDetails: React.FC<BreakDetailsProps> = ({ breaks, colors }) => {
  if (!breaks || breaks.length === 0) {
    return null;
  }

  return (
    <View style={styles.breakDetailsContainer}>
      {breaks.map((b, i) => (
        <View
          key={b.start}
          style={[
            styles.breakDetailRow,
            { borderColor: colors.border },
          ]}
        >
          <View style={styles.breakDetailHeader}>
            <ThemedText
              style={[
                styles.breakDetailIndex,
                { color: colors.textSecondary },
              ]}
            >
              #{i + 1}
            </ThemedText>
            <ThemedText
              style={[styles.breakDetailTime, { color: colors.text }]}
            >
              {new Date(b.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {b.end
                ? new Date(b.end).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "ongoing"}
            </ThemedText>
            <View style={styles.breakDurationChip}>
              <ThemedText style={styles.breakDurationChipText}>
                {b.durationMinutes}m
              </ThemedText>
            </View>
          </View>
          {b.note ? (
            <View
              style={[
                styles.breakNoteBox,
                { borderColor: colors.border },
              ]}
            >
              <ThemedText
                style={[styles.breakDetailNote, { color: colors.text }]}
              >
                <ThemedText style={styles.breakDetailNoteLabel}>
                  Note:{" "}
                </ThemedText>
                {b.note}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
};

const styles = {
  breakDetailsContainer: {
    marginTop: 8,
    gap: 8,
  },
  breakDetailRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  breakDetailHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  breakDetailIndex: {
    fontSize: 12,
    fontWeight: "500" as const,
    minWidth: 24,
  },
  breakDetailTime: {
    fontSize: 14,
    flex: 1,
  },
  breakDurationChip: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  breakDurationChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#666",
  },
  breakNoteBox: {
    marginTop: 4,
    padding: 6,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "#F8F8F8",
  },
  breakDetailNote: {
    fontSize: 12,
    fontStyle: "italic" as const,
  },
  breakDetailNoteLabel: {
    fontWeight: "600" as const,
  },
};
