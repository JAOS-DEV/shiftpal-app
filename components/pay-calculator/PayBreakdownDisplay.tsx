import { useTheme } from "@/providers/ThemeProvider";
import { AllowanceItem, PayBreakdown } from "@/types/settings";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface PayBreakdownDisplayProps {
  breakdown: PayBreakdown;
  currencySymbol: string;
  hoursWorked?: { hours: number; minutes: number };
  overtimeWorked?: { hours: number; minutes: number };
  baseRate?: number;
  overtimeRate?: number;
  allowanceItems?: AllowanceItem[];
  totalHours?: number;
  showTitle?: boolean;
  title?: string;
}

export const PayBreakdownDisplay: React.FC<PayBreakdownDisplayProps> = ({
  breakdown,
  currencySymbol,
  hoursWorked,
  overtimeWorked,
  baseRate,
  overtimeRate,
  allowanceItems = [],
  totalHours = 0,
  showTitle = true,
  title = "Pay Breakdown",
}) => {
  const { colors } = useTheme();

  // Helper function to format hours and minutes
  const formatHours = (hm?: { hours: number; minutes: number }): string => {
    if (!hm) return "0:00";
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
      )}

      {/* Comprehensive breakdown in circled style */}
      <View
        style={[styles.comprehensiveBreakdown, { borderColor: colors.primary }]}
      >
        {/* Hours breakdown section */}
        {hoursWorked &&
          baseRate &&
          (hoursWorked.hours > 0 || hoursWorked.minutes > 0) && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Hours Breakdown
              </ThemedText>
              <View style={styles.breakdownRow}>
                <ThemedText style={styles.breakdownLabel}>
                  Standard {formatHours(hoursWorked)} @ {currencySymbol}
                  {baseRate.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.breakdownValue}>
                  {currencySymbol}
                  {(
                    (hoursWorked.hours + hoursWorked.minutes / 60) *
                    baseRate
                  ).toFixed(2)}
                </ThemedText>
              </View>
              {overtimeWorked &&
                (overtimeWorked.hours > 0 || overtimeWorked.minutes > 0) &&
                overtimeRate && (
                  <View style={styles.breakdownRow}>
                    <ThemedText style={styles.breakdownLabel}>
                      Overtime {formatHours(overtimeWorked)} @ {currencySymbol}
                      {overtimeRate.toFixed(2)}
                    </ThemedText>
                    <ThemedText style={styles.breakdownValue}>
                      {currencySymbol}
                      {(
                        (overtimeWorked.hours + overtimeWorked.minutes / 60) *
                        overtimeRate
                      ).toFixed(2)}
                    </ThemedText>
                  </View>
                )}
            </View>
          )}

        {/* Uplifts section */}
        {(breakdown?.uplifts ?? 0) > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Uplifts</ThemedText>
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.breakdownLabel}>Night Shift</ThemedText>
              <ThemedText style={styles.breakdownValue}>
                {currencySymbol}
                {(breakdown?.uplifts ?? 0).toFixed(2)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Allowances section */}
        {allowanceItems.length > 0 && (breakdown?.allowances ?? 0) > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Allowances</ThemedText>
            {allowanceItems.map((allowance) => {
              // Calculate the amount for this allowance
              let amount = 0;
              if (allowance.unit === "perShift") {
                amount = allowance.value;
              } else if (allowance.unit === "perHour") {
                amount = allowance.value * totalHours;
              } else if (allowance.unit === "perDay") {
                amount = allowance.value; // Per day is treated as per shift for now
              }

              return (
                <View key={allowance.id} style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownLabel}>
                    {allowance.type}
                  </ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    {currencySymbol}
                    {amount.toFixed(2)}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        {/* Deductions section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Deductions</ThemedText>
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>Tax</ThemedText>
            <ThemedText style={styles.deductionValue}>
              -{currencySymbol}
              {(breakdown?.tax ?? 0).toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>NI</ThemedText>
            <ThemedText style={styles.deductionValue}>
              -{currencySymbol}
              {(breakdown?.ni ?? 0).toFixed(2)}
            </ThemedText>
          </View>
        </View>

        {/* Total section */}
        <View style={styles.totalSection}>
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.grossLabel}>Gross</ThemedText>
            <ThemedText style={styles.grossValue}>
              {currencySymbol}
              {(breakdown?.gross ?? 0).toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>
              {currencySymbol}
              {(breakdown?.total ?? 0).toFixed(2)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    marginBottom: 12,
  },
  comprehensiveBreakdown: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#495057",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#6C757D",
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28A745",
  },
  deductionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: "#DEE2E6",
    paddingTop: 12,
    marginTop: 8,
  },
  grossLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  grossValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#28A745",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#DEE2E6",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007AFF",
  },
});
