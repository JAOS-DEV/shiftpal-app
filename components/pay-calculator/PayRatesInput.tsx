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
}) => {
  // Handle base rate change
  const handleBaseRateChange = (id: string) => {
    onBaseRateChange(id);
  };

  // Handle overtime rate change
  const handleOvertimeRateChange = (id: string) => {
    onOvertimeRateChange(id);
  };

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Rates
      </ThemedText>
      <View style={styles.rateInputs}>
        <View style={styles.flex1}>
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
          />
        </View>

        <View style={styles.flex1}>
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
    borderColor: "#E5E5EA",
    backgroundColor: "white",
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
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  flex1: {
    flex: 1,
  },
});
