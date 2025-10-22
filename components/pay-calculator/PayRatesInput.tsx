import { useTheme } from "@/providers/ThemeProvider";
import { PayRate } from "@/types/settings";
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
  // Warning props
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

  // Show warning if there are shifts but no pay rates
  const showWarning = hasShifts && !hasPayRates;

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

      {/* Warning for shifts without pay rates */}
      {showWarning && (
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
            ⚠️ You have shifts recorded but no pay rates set. Set your rates
            below to calculate pay.
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
});
