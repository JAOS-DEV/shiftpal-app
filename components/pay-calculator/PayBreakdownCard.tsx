import { useTheme } from "@/providers/ThemeProvider";
import { PayBreakdown } from "@/types/settings";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface PayBreakdownCardProps {
  breakdown: PayBreakdown | null;
  currencySymbol: string;
  isSaving: boolean;
  onSave: () => void;
  // New props for warnings and rate breakdown
  hasShifts?: boolean;
  hasPayRates?: boolean;
  hoursWorked?: { hours: number; minutes: number };
  overtimeWorked?: { hours: number; minutes: number };
  baseRate?: number;
  overtimeRate?: number;
}

export const PayBreakdownCard: React.FC<PayBreakdownCardProps> = ({
  breakdown,
  currencySymbol,
  isSaving,
  onSave,
  hasShifts = false,
  hasPayRates = true,
  hoursWorked,
  overtimeWorked,
  baseRate,
  overtimeRate,
}) => {
  const { colors } = useTheme();

  // Helper function to format hours and minutes
  const formatHours = (hm?: { hours: number; minutes: number }): string => {
    if (!hm) return "0:00";
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  };

  // Show warning if there are shifts but no pay rates
  const showWarning = hasShifts && !hasPayRates;

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Total Pay
      </ThemedText>

      {/* Warning for shifts without pay rates */}
      {showWarning && (
        <View style={styles.warningContainer}>
          <ThemedText style={styles.warningText}>
            ⚠️ You have shifts recorded but no pay rates set. Set your rates
            above to calculate pay.
          </ThemedText>
        </View>
      )}

      {/* Rate breakdown display */}
      {hasShifts && hasPayRates && hoursWorked && baseRate && (
        <View style={styles.rateBreakdownContainer}>
          <ThemedText style={styles.rateBreakdownTitle}>
            Hours Breakdown
          </ThemedText>
          <View style={styles.rateBreakdownRow}>
            <ThemedText style={styles.rateBreakdownLabel}>
              Standard {formatHours(hoursWorked)} @ {currencySymbol}
              {baseRate.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.rateBreakdownValue}>
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
              <View style={styles.rateBreakdownRow}>
                <ThemedText style={styles.rateBreakdownLabel}>
                  Overtime {formatHours(overtimeWorked)} @ {currencySymbol}
                  {overtimeRate.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.rateBreakdownValue}>
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
      <ThemedText style={styles.totalText}>
        {currencySymbol}
        {(breakdown?.total ?? 0).toFixed(2)}
      </ThemedText>
      <View style={styles.breakdownRow}>
        <ThemedText>Standard</ThemedText>
        <ThemedText>
          {currencySymbol}
          {(breakdown?.base ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.breakdownRow}>
        <ThemedText>Overtime</ThemedText>
        <ThemedText>
          {currencySymbol}
          {(breakdown?.overtime ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.breakdownRow}>
        <ThemedText>Uplifts</ThemedText>
        <ThemedText>
          {currencySymbol}
          {(breakdown?.uplifts ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.breakdownRow}>
        <ThemedText>Allowances</ThemedText>
        <ThemedText>
          {currencySymbol}
          {(breakdown?.allowances ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.breakdownRow}>
        <ThemedText>Gross</ThemedText>
        <ThemedText>
          {currencySymbol}
          {(breakdown?.gross ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.breakdownRow}>
        <ThemedText>Tax</ThemedText>
        <ThemedText style={styles.negativeText}>
          -{currencySymbol}
          {(breakdown?.tax ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.breakdownRow}>
        <ThemedText>NI</ThemedText>
        <ThemedText style={styles.negativeText}>
          -{currencySymbol}
          {(breakdown?.ni ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <TouchableOpacity
        style={[
          styles.saveBtn,
          Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        ]}
        onPress={onSave}
        disabled={isSaving}
      >
        <ThemedText style={styles.saveBtnText}>
          {isSaving ? "Saving..." : "Save Pay"}
        </ThemedText>
      </TouchableOpacity>
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
  cardTitle: {
    marginBottom: 12,
  },
  totalText: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 36,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  negativeText: {
    color: "#FF3B30",
  },
  saveBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
  },
  saveBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "#FFF3CD",
    borderColor: "#FFEAA7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "500",
  },
  rateBreakdownContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rateBreakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#495057",
  },
  rateBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rateBreakdownLabel: {
    fontSize: 14,
    color: "#6C757D",
  },
  rateBreakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28A745",
  },
});
