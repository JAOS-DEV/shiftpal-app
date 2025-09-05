import { Shift } from "@/types/shift";
import { formatDurationText } from "@/utils/timeUtils";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface DailyTotalsProps {
  shifts: Shift[];
}

export function DailyTotals({ shifts }: DailyTotalsProps) {
  const totalMinutes = shifts.reduce(
    (sum, shift) => sum + shift.durationMinutes,
    0
  );
  const totalText = formatDurationText(totalMinutes);

  if (shifts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>
          Daily Total
        </ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No shifts to total</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Daily Total
      </ThemedText>

      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Total Time:</ThemedText>
          <ThemedText style={styles.totalValue}>{totalText}</ThemedText>
        </View>

        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Total Minutes:</ThemedText>
          <ThemedText style={styles.totalMinutesValue}>
            {totalMinutes} min
          </ThemedText>
        </View>

        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Shifts Count:</ThemedText>
          <ThemedText style={styles.totalValue}>{shifts.length}</ThemedText>
        </View>
      </View>

      {totalMinutes > 0 && (
        <View style={styles.summaryContainer}>
          <ThemedText style={styles.summaryText}>
            {totalMinutes >= 480 ? "Great work! " : ""}
            You've worked {totalText} today
            {shifts.length > 1 ? ` across ${shifts.length} shifts` : ""}.
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  totalsContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.8,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  totalMinutesValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34C759",
    fontFamily: "monospace",
  },
  summaryContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F0F9F4",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
