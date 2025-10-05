import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { NiRules } from "@/types/settings";
import React, { useState } from "react";
import {
    StyleSheet,
    Switch,
    TextInput,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

interface NiSettingsSectionProps {
  niRules: NiRules | undefined;
  currencySymbol: string;
  onSettingsChange: () => void;
}

export const NiSettingsSection: React.FC<NiSettingsSectionProps> = ({
  niRules,
  currencySymbol,
  onSettingsChange,
}) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState(niRules?.percentage !== undefined && niRules?.percentage !== 0);
  const [percentage, setPercentage] = useState(
    niRules?.percentage?.toString() || "12"
  );
  const [threshold, setThreshold] = useState(
    niRules?.threshold?.toString() || "190"
  );

  const updateNiRules = async (updates: Partial<NiRules>): Promise<void> => {
    await settingsService.setPayRules({ ni: { ...niRules, ...updates } });
    onSettingsChange();
  };

  const handleEnabledChange = async (enabled: boolean): Promise<void> => {
    setIsEnabled(enabled);
    if (enabled) {
      await updateNiRules({
        type: "flat",
        percentage: parseFloat(percentage) || 12,
        threshold: parseFloat(threshold) || 190,
      });
    } else {
      await updateNiRules({
        percentage: 0,
        threshold: 0,
      });
    }
  };

  const handlePercentageChange = async (value: string): Promise<void> => {
    setPercentage(value);
    const numValue = parseFloat(value) || 0;
    await updateNiRules({ percentage: numValue });
  };

  const handleThresholdChange = async (value: string): Promise<void> => {
    setThreshold(value);
    const numValue = parseFloat(value) || 0;
    await updateNiRules({ threshold: numValue });
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
        National Insurance Settings
      </ThemedText>

      <View style={styles.toggleRow}>
        <ThemedText style={[styles.flex1, { color: colors.text }]}>
          Enable NI calculation
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
              NI Percentage
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="12"
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
              Weekly Threshold
            </ThemedText>
            <View style={styles.inputRow}>
              <ThemedText style={[styles.inputPrefix, { color: colors.textSecondary }]}>
                {currencySymbol}
              </ThemedText>
              <TextInput
                placeholder="190"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textSecondary}
                value={threshold}
                onChangeText={handleThresholdChange}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <ThemedText style={[styles.inputDescription, { color: colors.textSecondary }]}>
              Gross pay above this amount per week is NI-chargeable
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
