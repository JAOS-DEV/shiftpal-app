import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../ui/ThemedText";
import { IconSymbol } from "../../ui/IconSymbol";

interface BreakHistoryProps {
  breaks: Array<{ start: number; end?: number; durationMs: number; note?: string }>;
  totalBreakMs?: number;
}

export const BreakHistory: React.FC<BreakHistoryProps> = ({
  breaks,
  totalBreakMs,
}) => {
  const [showBreakHistory, setShowBreakHistory] = useState(true);

  // Helper function to safely format milliseconds as HH:MM:SS
  const formatTimeFromMs = (ms: number): string => {
    if (!Number.isFinite(ms) || ms < 0) {
      return "00:00:00";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Helper function to safely format timestamp as time
  const formatTimeFromTimestamp = (timestamp: number): string => {
    if (!Number.isFinite(timestamp) || timestamp < 0) {
      return "00:00";
    }
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "00:00";
    }
  };

  if (!breaks || breaks.length === 0) {
    return null;
  }

  return (
    <View style={styles.breakHistoryContainer}>
      <TouchableOpacity
        onPress={() => setShowBreakHistory((s) => !s)}
        accessibilityLabel="Toggle break history"
        style={styles.breakHeaderRow}
      >
        <ThemedText style={styles.breakHistoryTitle}>
          Break history
        </ThemedText>
        <IconSymbol
          name="chevron.right"
          size={20}
          color="#666"
          style={{
            transform: [{ rotate: showBreakHistory ? "90deg" : "0deg" }],
          }}
        />
      </TouchableOpacity>

      {showBreakHistory ? (
        <>
          {breaks.map((b, idx) => (
            <View key={b.start} style={styles.breakRow}>
              <ThemedText style={styles.breakIndex}>
                #{idx + 1}
              </ThemedText>
              <ThemedText style={styles.breakDuration}>
                {formatTimeFromMs(b.durationMs)}
              </ThemedText>
              <ThemedText style={styles.breakTimes}>
                {formatTimeFromTimestamp(b.start)}
                {" - "}
                {b.end
                  ? formatTimeFromTimestamp(b.end)
                  : "ongoing"}
              </ThemedText>
              {b.note ? (
                <ThemedText style={styles.breakNote}>{b.note}</ThemedText>
              ) : null}
            </View>
          ))}
          {typeof totalBreakMs === "number" ? (
            <View style={styles.breakTotalRow}>
              <ThemedText style={styles.breakTotalLabel}>
                Total breaks
              </ThemedText>
              <ThemedText style={styles.breakTotalValue}>
                {formatTimeFromMs(totalBreakMs)}
              </ThemedText>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
};

const styles = {
  breakHistoryContainer: {
    marginTop: 16,
  },
  breakHeaderRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  breakHistoryTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  breakRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 4,
    gap: 8,
  },
  breakIndex: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#666",
    minWidth: 24,
  },
  breakDuration: {
    fontSize: 14,
    fontWeight: "600" as const,
    minWidth: 60,
  },
  breakTimes: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  breakNote: {
    fontSize: 12,
    fontStyle: "italic" as const,
    color: "#888",
    marginTop: 2,
  },
  breakTotalRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    marginTop: 8,
  },
  breakTotalLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  breakTotalValue: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
};
