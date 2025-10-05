import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { TaxRules } from "@/types/settings";
import React, { useState } from "react";
import {
    StyleSheet,
    Switch,
    TextInput,
    View
} from "react-native";
import { ThemedText } from "../ThemedText";

interface TaxSettingsSectionProps {
  taxRules: TaxRules | undefined;
  currencySymbol: string;
  onSettingsChange: () => void;
}

export const TaxSettingsSection: React.FC<TaxSettingsSectionProps> = ({
  taxRules,
  currencySymbol,
  onSettingsChange,
}) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState(taxRules?.percentage !== undefined && taxRules?.percentage !== 0);
  const [percentage, setPercentage] = useState(
    taxRules?.percentage?.toString() || "20"
  );
  const [personalAllowance, setPersonalAllowance] = useState(
    taxRules?.personalAllowance?.toString() || "12570"
  );

  const updateTaxRules = async (updates: Partial<TaxRules>): Promise<void> => {
    await settingsService.setPayRules({ tax: { ...taxRules, ...updates } });
    onSettingsChange();
  };

  const handleEnabledChange = async (enabled: boolean): Promise<void> => {
    setIsEnabled(enabled);
    if (enabled) {
      await updateTaxRules({
        type: "flat",
        percentage: parseFloat(percentage) || 20,
        personalAllowance: parseFloat(personalAllowance) || 12570,
      });
    } else {
      await updateTaxRules({
        percentage: 0,
        personalAllowance: 0,
      });
    }
  };

  const handlePercentageChange = async (value: string): Promise<void> => {
    setPercentage(value);
    const numValue = parseFloat(value) || 0;
    await updateTaxRules({ percentage: numValue });
  };

  const handlePersonalAllowanceChange = async (value: string): Promise<void> => {
    setPersonalAllowance(value);
    const numValue = parseFloat(value) || 0;
    await updateTaxRules({ personalAllowance: numValue });
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
        Tax Settings
      </ThemedText>

      <View style={styles.toggleRow}>
        <ThemedText style={[styles.flex1, { color: colors.text }]}>
          Enable tax calculation
        </ThemedText>
        <Switch
          value={isEnabled}
          onValueChange={handleEnabledChange}
        />
      </View>

      {isEnabled && (
        <>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
              Tax Percentage
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="20"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textSecondary}
                value={percentage}
                onChangeText={handlePercentageChange}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
              <ThemedText style={[styles.inputSuffix, { color: colors.textSecondary }]}>
                %
              </ThemedText>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
              Personal Allowance
            </ThemedText>
            <View style={styles.inputRow}>
              <ThemedText style={[styles.inputPrefix, { color: colors.textSecondary }]}>
                {currencySymbol}
              </ThemedText>
              <TextInput
                placeholder="12570"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textSecondary}
                value={personalAllowance}
                onChangeText={handlePersonalAllowanceChange}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <ThemedText style={[styles.inputDescription, { color: colors.textSecondary }]}>
              Amount deducted from gross before calculating tax
            </ThemedText>
          </View>
        </>
      )}
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  flex1: {
    flex: 1,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: "500",
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: "500",
  },
  inputDescription: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: "italic",
  },
});
