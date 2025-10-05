import { useTheme } from "@/providers/ThemeProvider";
import React, { useMemo } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

interface GoalProgressBarProps {
  goal: number;
  achieved: number;
  currencySymbol: string;
  period: "week" | "month";
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  goal,
  achieved,
  currencySymbol,
  period,
}) => {
  const { colors } = useTheme();

  const periodText = useMemo(() => ({
    adjective: period === "week" ? "weekly" : "monthly",
    title: period === "week" ? "Weekly Goal" : "Monthly Goal",
  }), [period]);

  if (!goal || goal <= 0) {
    return (
      <ThemedText style={styles.goalHintText}>
        Set a {periodText.adjective} goal in Settings →
        Preferences to track progress.
      </ThemedText>
    );
  }

  const percent = Math.max(0, Math.min(200, (achieved / goal) * 100));
  const fillColor = percent >= 100 ? "#28A745" : "#007AFF";
  const remaining = Math.max(0, goal - achieved);

  return (
    <>
      <View style={styles.goalHeaderRow}>
        <ThemedText style={styles.goalTitle}>
          {periodText.title}
        </ThemedText>
        <ThemedText style={styles.goalAmounts}>
          {currencySymbol}
          {achieved.toFixed(2)} / {currencySymbol}
          {goal.toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.round(Math.min(100, percent))}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      <View style={styles.goalMetaRow}>
        <View style={styles.percentBadge}>
          <ThemedText style={styles.percentBadgeText}>
            {Math.round(percent)}%
          </ThemedText>
        </View>
        <ThemedText style={styles.remainingText}>
          {remaining > 0
            ? `${currencySymbol}${remaining.toFixed(2)} to go`
            : `+${currencySymbol}${(achieved - goal).toFixed(2)} over goal`}
        </ThemedText>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  goalHintText: {
    fontStyle: "italic",
    opacity: 0.8,
  },
  goalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  goalTitle: {
    fontWeight: "700",
  },
  goalAmounts: {
    fontWeight: "600",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  goalMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  percentBadgeText: {
    fontWeight: "700",
  },
  remainingText: {
    opacity: 0.8,
  },
});

