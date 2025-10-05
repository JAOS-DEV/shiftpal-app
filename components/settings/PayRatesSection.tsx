import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { PayRate, PayRateType } from "@/types/settings";
import React, { useState } from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "../Dropdown";
import { ThemedText } from "../ThemedText";

interface PayRatesSectionProps {
  payRates: PayRate[];
  onRatesChange: () => void;
  currencySymbol: string;
}

export const PayRatesSection: React.FC<PayRatesSectionProps> = ({
  payRates,
  onRatesChange,
  currencySymbol,
}) => {
  const { colors } = useTheme();
  const [newRate, setNewRate] = useState<{
    label: string;
    value: string;
    type: PayRateType;
  }>({ label: "", value: "", type: "base" });

  const addRate = async (): Promise<void> => {
    if (!newRate.label || !newRate.value) return;
    const valueNum = parseFloat(newRate.value.replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(valueNum)) return;
    await settingsService.addPayRate({
      label: newRate.label,
      value: valueNum,
      type: newRate.type,
    });
    setNewRate({ label: "", value: "", type: "base" });
    onRatesChange();
  };

  const deleteRate = async (id: string): Promise<void> => {
    await settingsService.deletePayRate(id);
    onRatesChange();
  };

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <ThemedText
        type="subtitle"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        Saved Pay Rates
      </ThemedText>

      <View style={styles.content}>
        <View style={styles.rowGap}>
          <TextInput
            placeholder="Label (e.g., Standard Rate)"
            placeholderTextColor={colors.textSecondary}
            value={newRate.label}
            onChangeText={(t) => setNewRate((p) => ({ ...p, label: t }))}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
          <View style={styles.inlineInputs}>
            <TextInput
              placeholder={`${currencySymbol} / hour`}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textSecondary}
              value={newRate.value}
              onChangeText={(t) => setNewRate((p) => ({ ...p, value: t }))}
              style={[
                styles.input,
                styles.flex1,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
            <Dropdown
              compact
              placeholder="Type"
              style={styles.typeDropdown}
              value={newRate.type}
              onChange={(v) => setNewRate((p) => ({ ...p, type: v as PayRateType }))}
              items={[
                { value: "base", label: "Base" },
                { value: "overtime", label: "Overtime" },
                { value: "premium", label: "Premium" },
              ]}
            />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={addRate}
          >
            <ThemedText
              style={[styles.actionButtonText, { color: colors.primary }]}
            >
              Add Rate
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.ratesList}>
          {payRates?.length ? (
            payRates.map((r: PayRate) => (
              <View
                key={r.id}
                style={[styles.rateRow, { borderColor: colors.border }]}
              >
                <View style={styles.rateLabel}>
                  <ThemedText
                    style={styles.rateLabelText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {r.label}
                  </ThemedText>
                </View>
                <View style={styles.rateMeta}>
                  <ThemedText>
                    {currencySymbol}
                    {r.value.toFixed(2)}
                  </ThemedText>
                  <ThemedText style={styles.rateType}>{r.type}</ThemedText>
                  <TouchableOpacity onPress={() => deleteRate(r.id)}>
                    <ThemedText style={{ color: colors.error }}>
                      Delete
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <ThemedText style={{ color: colors.textSecondary }}>
              No rates yet. Add one above.
            </ThemedText>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
  rowGap: {
    gap: 8,
  },
  inlineInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  flex1: {
    flex: 1,
  },
  typeDropdown: {
    width: 140,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  ratesList: {
    gap: 8,
  },
  rateRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rateLabel: {
    flex: 1,
    minWidth: 0,
  },
  rateLabelText: {
    fontWeight: "600",
  },
  rateMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  rateType: {
    color: "#666",
  },
});

