import { useTheme } from "@/providers/ThemeProvider";
import { HoursAndMinutes, PayRate } from "@/types/settings";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { RateDropdown } from "./RateDropdown";

interface PayRatesInputProps {
  baseRates: PayRate[];
  overtimeRates: PayRate[];
  selectedBaseRateId: string | null;
  selectedOvertimeRateId: string | null;
  manualBaseRate: string;
  manualOvertimeRate: string;
  currencySymbol: string;
  onBaseRateChange: (id: string) => void;
  onOvertimeRateChange: (id: string) => void;
  onManualBaseRateChange: (value: string) => void;
  onManualOvertimeRateChange: (value: string) => void;
  // Hours props for warnings
  hoursWorked?: HoursAndMinutes;
  overtimeWorked?: HoursAndMinutes;
  // Warning props (keeping for backward compatibility)
  hasShifts?: boolean;
  hasPayRates?: boolean;
}

export const PayRatesInput: React.FC<PayRatesInputProps> = ({
  baseRates,
  overtimeRates,
  selectedBaseRateId,
  selectedOvertimeRateId,
  manualBaseRate,
  manualOvertimeRate,
  currencySymbol,
  onBaseRateChange,
  onOvertimeRateChange,
  onManualBaseRateChange,
  onManualOvertimeRateChange,
  hoursWorked,
  overtimeWorked,
  hasShifts = false,
  hasPayRates = true,
}) => {
  const { colors } = useTheme();

  // Handle base rate change
  const handleBaseRateChange = (id: string) => {
    onBaseRateChange(id);
  };

  // Handle overtime rate change
  const handleOvertimeRateChange = (id: string) => {
    onOvertimeRateChange(id);
  };

  // Check if standard hours are present
  const hasStandardHours =
    (hoursWorked?.hours || 0) > 0 || (hoursWorked?.minutes || 0) > 0;

  // Check if overtime hours are present
  const hasOvertimeHours =
    (overtimeWorked?.hours || 0) > 0 || (overtimeWorked?.minutes || 0) > 0;

  // Check if standard rate is configured
  // Verify that selectedBaseRateId actually exists in baseRates
  const selectedBaseRateExists =
    selectedBaseRateId &&
    selectedBaseRateId !== "custom" &&
    baseRates.some((r) => r.id === selectedBaseRateId);

  // Check if we have a valid manual base rate
  const hasValidManualBaseRate = parseFloat(manualBaseRate || "") > 0;

  const hasStandardRate =
    selectedBaseRateExists ||
    (selectedBaseRateId === "custom" && hasValidManualBaseRate) ||
    (!selectedBaseRateId && hasValidManualBaseRate);

  // Additional check: if selectedBaseRateId exists but rate doesn't exist in array,
  // and no manual rate, then we DON'T have a valid rate
  const hasStaleBaseRate =
    selectedBaseRateId &&
    selectedBaseRateId !== "custom" &&
    !baseRates.some((r) => r.id === selectedBaseRateId);

  const hasActualStandardRate = hasStandardRate && !hasStaleBaseRate;

  // Check if overtime rate is configured
  // Verify that selectedOvertimeRateId actually exists in overtimeRates or baseRates
  const selectedOvertimeRateExists =
    selectedOvertimeRateId &&
    selectedOvertimeRateId !== "custom" &&
    (overtimeRates.some((r) => r.id === selectedOvertimeRateId) ||
      baseRates.some((r) => r.id === selectedOvertimeRateId));

  // Check if we have a valid manual overtime rate
  const hasValidManualOvertimeRate = parseFloat(manualOvertimeRate || "") > 0;

  const hasOvertimeRate =
    selectedOvertimeRateExists ||
    (selectedOvertimeRateId === "custom" && hasValidManualOvertimeRate) ||
    (!selectedOvertimeRateId && hasValidManualOvertimeRate);

  // Check for stale overtime rate ID (selected but doesn't exist)
  const hasStaleOvertimeRate =
    selectedOvertimeRateId &&
    selectedOvertimeRateId !== "custom" &&
    !(
      overtimeRates.some((r) => r.id === selectedOvertimeRateId) ||
      baseRates.some((r) => r.id === selectedOvertimeRateId)
    );

  const hasActualOvertimeRate = hasOvertimeRate && !hasStaleOvertimeRate;

  // Check if overtime rate is specifically an overtime rate (not just using base rate)
  const hasSpecificOvertimeRate =
    selectedOvertimeRateId &&
    selectedOvertimeRateId !== "custom" &&
    overtimeRates.some((r) => r.id === selectedOvertimeRateId);

  const hasCustomOvertimeRate =
    (selectedOvertimeRateId === "custom" && hasValidManualOvertimeRate) ||
    (!selectedOvertimeRateId && hasValidManualOvertimeRate);

  // Show warning if:
  // 1. Standard hours present but no standard rate
  // 2. Stale rate detected (regardless of hours - rate is invalid)
  // 3. Selected "custom" but no manual rate entered AND hours present
  const hasEmptyCustomBaseRate =
    selectedBaseRateId === "custom" && !hasValidManualBaseRate;

  const showStandardWarning =
    (hasStandardHours && !hasActualStandardRate) ||
    hasStaleBaseRate ||
    (hasStandardHours && hasEmptyCustomBaseRate);

  // Show warning if:
  // 1. Overtime hours present but no overtime rate
  // 2. Stale overtime rate detected (regardless of hours)
  // 3. Selected "custom" but no manual rate entered AND hours present
  const hasEmptyCustomOvertimeRate =
    selectedOvertimeRateId === "custom" && !hasValidManualOvertimeRate;

  const showOvertimeWarning =
    (hasOvertimeHours && !hasActualOvertimeRate) ||
    hasStaleOvertimeRate ||
    (hasOvertimeHours && hasEmptyCustomOvertimeRate);
  
  // Show info if overtime hours exist but using base rate as fallback
  // Only show if we have an actual valid standard rate
  const showOvertimeInfo =
    hasOvertimeHours &&
    hasActualStandardRate &&
    !hasStaleBaseRate &&
    !showOvertimeWarning &&
    !hasSpecificOvertimeRate &&
    !hasCustomOvertimeRate;

  // Legacy warning removed - specific warnings provide better UX

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Rates
      </ThemedText>

      {/* Legacy warning removed - specific warnings are more helpful */}

      {/* Warning for standard hours without standard rate */}
      {showStandardWarning && (
        <View
          style={[
            styles.warningContainer,
            {
              backgroundColor: colors.warning + "20",
              borderColor: colors.warning + "40",
            },
          ]}
        >
          <ThemedText style={[styles.warningText, { color: colors.warning }]}>
            {hasStaleBaseRate
              ? "⚠️ The selected standard rate no longer exists. Please select a valid standard rate below."
              : hasEmptyCustomBaseRate
              ? "⚠️ You have standard hours but no standard rate set. Enter a rate or select from settings."
              : hasStandardHours
              ? "⚠️ You have standard hours but no standard rate set. Set your standard rate below to calculate pay."
              : "⚠️ No standard rate set. Set your standard rate below to calculate pay."}
          </ThemedText>
        </View>
      )}

      {/* Warning for overtime hours without overtime rate */}
      {showOvertimeWarning && (
        <View
          style={[
            styles.warningContainer,
            {
              backgroundColor: colors.warning + "20",
              borderColor: colors.warning + "40",
            },
          ]}
        >
          <ThemedText style={[styles.warningText, { color: colors.warning }]}>
            {hasStaleOvertimeRate
              ? "⚠️ The selected overtime rate no longer exists. Please select a valid overtime rate below."
              : hasEmptyCustomOvertimeRate
              ? "⚠️ You have overtime hours but no overtime rate set. Enter a rate or select from settings."
              : hasOvertimeHours
              ? "⚠️ You have overtime hours but no overtime rate set. Set your overtime rate below to calculate pay."
              : "⚠️ No overtime rate set. Set your overtime rate below to calculate pay."}
          </ThemedText>
        </View>
      )}

      {/* Info when using base rate for overtime */}
      {showOvertimeInfo && (
        <View
          style={[
            styles.infoContainer,
            {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary + "30",
            },
          ]}
        >
          <ThemedText style={[styles.infoText, { color: colors.primary }]}>
            ℹ️ Using standard rate for overtime hours. Select an overtime rate
            for accurate calculations.
          </ThemedText>
        </View>
      )}

      <View style={styles.rateInputs}>
        <View style={styles.flex1}>
          <ThemedText
            style={[styles.rateLabel, { color: colors.textSecondary }]}
          >
            Standard Rate
          </ThemedText>
          <RateDropdown
            compact
            placeholder="Select base rate"
            customPlaceholder={`${currencySymbol}0.00`}
            currencySymbol={currencySymbol}
            rateType="base"
            value={selectedBaseRateId || baseRates[0]?.id || "custom"}
            onChange={handleBaseRateChange}
            onCustomChange={onManualBaseRateChange}
            items={baseRates.map((r) => ({
              value: r.id,
              label: r.label,
            }))}
            rates={baseRates}
          />
        </View>

        <View style={styles.flex1}>
          <ThemedText
            style={[styles.rateLabel, { color: colors.textSecondary }]}
          >
            Overtime Rate
          </ThemedText>
          <RateDropdown
            compact
            placeholder="Select overtime rate"
            customPlaceholder={`${currencySymbol}0.00`}
            currencySymbol={currencySymbol}
            rateType="overtime"
            value={selectedOvertimeRateId || overtimeRates[0]?.id || "custom"}
            onChange={handleOvertimeRateChange}
            onCustomChange={onManualOvertimeRateChange}
            items={overtimeRates.map((r) => ({
              value: r.id,
              label: r.label,
            }))}
            rates={overtimeRates}
          />
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
    borderColor: "#E5E5EA", // Will be overridden by theme
    backgroundColor: "white", // Will be overridden by theme
  },
  cardTitle: {
    marginBottom: 12,
  },
  rateInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rateInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  flex1: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057", // Will be overridden by theme
    marginBottom: 6,
  },
  warningContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
