import { useSettings } from "@/hooks/useSettings";
import { formatTime } from "@/utils/formatUtils";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ui/ThemedText";

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

export const BreakDetails: React.FC<BreakDetailsProps> = ({
  breaks,
  colors,
}) => {
  const { settings } = useSettings();

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
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.breakDetailHeader}>
            <ThemedText
              style={[styles.breakDetailIndex, { color: colors.textSecondary }]}
            >
              Break #{i + 1}
            </ThemedText>
            <ThemedText
              style={[styles.breakDetailTime, { color: colors.text }]}
            >
              {formatTime(
                new Date(b.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                settings
              )}
              {" - "}
              {b.end
                ? formatTime(
                    new Date(b.end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    settings
                  )
                : "ongoing"}
            </ThemedText>
            <View
              style={[
                styles.breakDurationChip,
                { backgroundColor: colors.border },
              ]}
            >
              <ThemedText
                style={[
                  styles.breakDurationChipText,
                  { color: colors.textSecondary },
                ]}
              >
                {b.durationMinutes}m
              </ThemedText>
            </View>
          </View>
          {b.note ? (
            <View
              style={[
                styles.breakNoteBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ThemedText
                style={[styles.breakDetailNote, { color: colors.text }]}
              >
                <ThemedText
                  style={[styles.breakDetailNoteLabel, { color: colors.text }]}
                >
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
    backgroundColor: "white", // Will be overridden by theme
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
    backgroundColor: "#F2F2F7", // Will be overridden by theme
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  breakDurationChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#666", // Will be overridden by theme
  },
  breakNoteBox: {
    marginTop: 4,
    padding: 6,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "#F8F8F8", // Will be overridden by theme
  },
  breakDetailNote: {
    fontSize: 12,
    fontStyle: "italic" as const,
  },
  breakDetailNoteLabel: {
    fontWeight: "600" as const,
    fontSize: 12,
  },
};
