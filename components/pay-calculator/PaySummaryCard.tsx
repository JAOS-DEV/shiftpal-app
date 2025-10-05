import { AppSettings } from "@/types/settings";
import React from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { GoalProgressBar } from "./GoalProgressBar";

interface PaySummary {
  base: number;
  overtime: number;
  uplifts: number;
  allowances: number;
  gross: number;
  tax: number;
  ni: number;
  total: number;
  minutes: number;
}

interface PaySummaryCardProps {
  summary: PaySummary;
  currencySymbol: string;
  period: "week" | "month" | "all";
  settings: AppSettings | null;
}

export const PaySummaryCard: React.FC<PaySummaryCardProps> = ({
  summary,
  currencySymbol,
  period,
  settings,
}) => {
  const minutesToHMText = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const showGoal = period === "week" || period === "month";
  const goal = period === "week"
    ? settings?.preferences?.weeklyGoal || 0
    : period === "month"
    ? settings?.preferences?.monthlyGoal || 0
    : 0;

  return (
    <View style={styles.card}>
      {/* Goal progress */}
      {showGoal && (
        <View style={styles.goalSection}>
          <GoalProgressBar
            goal={goal}
            achieved={summary.total}
            currencySymbol={currencySymbol}
            period={period}
          />
        </View>
      )}

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCell}>
          <ThemedText style={styles.summaryLabel}>
            Total Standard Pay
          </ThemedText>
          <ThemedText style={styles.summaryValue}>
            {currencySymbol}
            {summary.base.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.summaryCell}>
          <ThemedText style={styles.summaryLabel}>
            Total Overtime Pay
          </ThemedText>
          <ThemedText style={styles.summaryValue}>
            {currencySymbol}
            {summary.overtime.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.summaryCell}>
          <ThemedText style={styles.summaryLabel}>Total Tax</ThemedText>
          <ThemedText style={styles.summaryNegValue}>
            {currencySymbol}
            {summary.tax.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.summaryCell}>
          <ThemedText style={styles.summaryLabel}>Total NI</ThemedText>
          <ThemedText style={styles.summaryNegValue}>
            {currencySymbol}
            {summary.ni.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.summaryCell}>
          <ThemedText style={styles.summaryLabel}>Total Hours</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {minutesToHMText(summary.minutes)}
          </ThemedText>
        </View>
        <View style={styles.summaryCell}>
          <ThemedText style={styles.summaryLabel}>Gross Total</ThemedText>
          <ThemedText style={styles.summaryPositive}>
            {currencySymbol}
            {summary.gross.toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.summaryCell}>
          <ThemedText style={styles.summaryLabel}>Final Total</ThemedText>
          <ThemedText style={styles.summaryPositive}>
            {currencySymbol}
            {summary.total.toFixed(2)}
          </ThemedText>
        </View>
      </View>
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
  goalSection: {
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCell: {
    width: "48%",
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: "700",
  },
  summaryPositive: {
    fontWeight: "700",
    color: "#28A745",
  },
  summaryNegValue: {
    fontWeight: "700",
    color: "#FF3B30",
  },
});

