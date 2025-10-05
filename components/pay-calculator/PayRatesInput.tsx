import { useTheme } from "@/providers/ThemeProvider";
import { PayRate } from "@/types/settings";
import React from "react";
import {
    Platform,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { Dropdown } from "../Dropdown";
import { ThemedText } from "../ThemedText";

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
  const { colors } = useTheme();

  const hasBaseRates = baseRates.length > 0;
  const hasOvertimeRates = overtimeRates.length > 0;

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Rates
      </ThemedText>
      <View style={styles.rateInputs}>
        {hasBaseRates ? (
          <View style={styles.flex1}>
            <Dropdown
              compact
              placeholder="Select base rate"
              value={selectedBaseRateId}
              onChange={onBaseRateChange}
              items={baseRates.map((r) => ({
                value: r.id,
                label: r.label,
              }))}
            />
          </View>
        ) : (
          <TextInput
            style={[styles.rateInput, styles.flex1]}
            keyboardType={Platform.OS === "web" ? "default" : "decimal-pad"}
            placeholder={`${currencySymbol} base / hr`}
            placeholderTextColor="#6B7280"
            selectionColor="#007AFF"
            value={manualBaseRate}
            onChangeText={onManualBaseRateChange}
          />
        )}

        {hasOvertimeRates ? (
          <View style={styles.flex1}>
            <Dropdown
              compact
              placeholder="Select overtime rate"
              value={selectedOvertimeRateId}
              onChange={onOvertimeRateChange}
              items={overtimeRates.map((r) => ({
                value: r.id,
                label: r.label,
              }))}
            />
          </View>
        ) : (
          <TextInput
            style={[styles.rateInput, styles.flex1]}
            keyboardType={Platform.OS === "web" ? "default" : "decimal-pad"}
            placeholder={`${currencySymbol} overtime / hr (optional)`}
            placeholderTextColor="#6B7280"
            selectionColor="#007AFF"
            value={manualOvertimeRate}
            onChangeText={onManualOvertimeRateChange}
          />
        )}
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

