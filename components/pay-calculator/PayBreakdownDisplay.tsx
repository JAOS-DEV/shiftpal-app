import { useTheme } from "@/providers/ThemeProvider";
import { AllowanceItem, PayBreakdown } from "@/types/settings";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ui/ThemedText";

interface PayBreakdownDisplayProps {
  breakdown: PayBreakdown;
  currencySymbol: string;
  hoursWorked?: { hours: number; minutes: number };
  overtimeWorked?: { hours: number; minutes: number };
  nightHours?: { hours: number; minutes: number };
  weekendHours?: { hours: number; minutes: number };
  baseRate?: number;
  overtimeRate?: number;
  nightRate?: number;
  weekendRate?: number;
  allowanceItems?: AllowanceItem[];
  totalHours?: number;
  showTitle?: boolean;
  title?: string;
  taxEnabled?: boolean;
  niEnabled?: boolean;
}

export const PayBreakdownDisplay: React.FC<PayBreakdownDisplayProps> = ({
  breakdown,
  currencySymbol,
  hoursWorked,
  overtimeWorked,
  nightHours,
  weekendHours,
  baseRate,
  overtimeRate,
  nightRate,
  weekendRate,
  allowanceItems = [],
  totalHours = 0,
  showTitle = true,
  title = "Pay Breakdown",
  taxEnabled = false,
  niEnabled = false,
}) => {
  const { colors } = useTheme();
  const shouldShowDeductions = taxEnabled || niEnabled;

  // Safely format rate values
  const formatRate = (rate: number | undefined): string => {
    if (typeof rate !== "number" || isNaN(rate)) return "0.00";
    return rate.toFixed(2);
  };

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
        style={[
          styles.comprehensiveBreakdown,
          {
            borderColor: colors.primary,
            backgroundColor: colors.card,
          },
        ]}
      >
        {/* Hours breakdown section */}
        {hoursWorked &&
          typeof baseRate === "number" &&
          baseRate > 0 &&
          (hoursWorked.hours > 0 || hoursWorked.minutes > 0) && (
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Hours Breakdown
              </ThemedText>
              <View style={styles.breakdownRow}>
                <ThemedText
                  style={[
                    styles.breakdownLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Standard {formatHours(hoursWorked)} @ {currencySymbol}
                  {formatRate(baseRate)}
                </ThemedText>
                <ThemedText
                  style={[styles.breakdownValue, { color: colors.success }]}
                >
                  {currencySymbol}
                  {(
                    (hoursWorked.hours + hoursWorked.minutes / 60) *
                    (baseRate || 0)
                  ).toFixed(2)}
                </ThemedText>
              </View>
              {overtimeWorked &&
                (overtimeWorked.hours > 0 || overtimeWorked.minutes > 0) &&
                typeof overtimeRate === "number" &&
                overtimeRate > 0 && (
                  <View style={styles.breakdownRow}>
                    <ThemedText
                      style={[
                        styles.breakdownLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Overtime {formatHours(overtimeWorked)} @ {currencySymbol}
                      {formatRate(overtimeRate)}
                    </ThemedText>
                    <ThemedText
                      style={[styles.breakdownValue, { color: colors.success }]}
                    >
                      {currencySymbol}
                      {(
                        (overtimeWorked.hours + overtimeWorked.minutes / 60) *
                        (overtimeRate || 0)
                      ).toFixed(2)}
                    </ThemedText>
                  </View>
                )}
            </View>
          )}

        {/* Uplifts section */}
        {(breakdown?.uplifts ?? 0) > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Uplifts
            </ThemedText>

            {/* Night Shift Uplift */}
            {(breakdown?.nightUplift ?? 0) > 0 && (
              <View style={styles.breakdownRow}>
                <ThemedText
                  style={[
                    styles.breakdownLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Night Shift
                  {nightHours &&
                    (nightHours.hours > 0 || nightHours.minutes > 0) &&
                    nightRate &&
                    nightRate > 0 &&
                    ` ${formatHours(nightHours)} @ ${currencySymbol}${formatRate(nightRate)}`}
                </ThemedText>
                <ThemedText
                  style={[styles.breakdownValue, { color: colors.success }]}
                >
                  {currencySymbol}
                  {(breakdown?.nightUplift ?? 0).toFixed(2)}
                </ThemedText>
              </View>
            )}

            {/* Weekend Uplift */}
            {(breakdown?.weekendUplift ?? 0) > 0 && (
              <View style={styles.breakdownRow}>
                <ThemedText
                  style={[
                    styles.breakdownLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Weekend
                  {weekendHours &&
                    (weekendHours.hours > 0 || weekendHours.minutes > 0) &&
                    weekendRate &&
                    weekendRate > 0 &&
                    ` ${formatHours(weekendHours)} @ ${currencySymbol}${formatRate(weekendRate)}`}
                </ThemedText>
                <ThemedText
                  style={[styles.breakdownValue, { color: colors.success }]}
                >
                  {currencySymbol}
                  {(breakdown?.weekendUplift ?? 0).toFixed(2)}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Allowances section */}
        {allowanceItems.length > 0 && (breakdown?.allowances ?? 0) > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Allowances
            </ThemedText>
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
                  <ThemedText
                    style={[
                      styles.breakdownLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {allowance.type}
                  </ThemedText>
                  <ThemedText
                    style={[styles.breakdownValue, { color: colors.success }]}
                  >
                    {currencySymbol}
                    {amount.toFixed(2)}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        {/* Deductions section */}
        {shouldShowDeductions && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Deductions
            </ThemedText>
            {taxEnabled && (
              <View style={styles.breakdownRow}>
                <ThemedText
                  style={[
                    styles.breakdownLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Tax
                </ThemedText>
                <ThemedText
                  style={[styles.deductionValue, { color: colors.error }]}
                >
                  -{currencySymbol}
                  {(breakdown?.tax ?? 0).toFixed(2)}
                </ThemedText>
              </View>
            )}
            {niEnabled && (
              <View style={styles.breakdownRow}>
                <ThemedText
                  style={[
                    styles.breakdownLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  NI
                </ThemedText>
                <ThemedText
                  style={[styles.deductionValue, { color: colors.error }]}
                >
                  -{currencySymbol}
                  {(breakdown?.ni ?? 0).toFixed(2)}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Total section */}
        <View style={[styles.totalSection, { borderTopColor: colors.border }]}>
          <View style={styles.breakdownRow}>
            <ThemedText style={[styles.grossLabel, { color: colors.text }]}>
              Gross
            </ThemedText>
            <ThemedText style={[styles.grossValue, { color: colors.success }]}>
              {currencySymbol}
              {(breakdown?.gross ?? 0).toFixed(2)}
            </ThemedText>
          </View>
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </ThemedText>
            <ThemedText style={[styles.totalValue, { color: colors.primary }]}>
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
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  deductionValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  grossLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  grossValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
  },
});
