import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AllowanceItem } from "@/types/settings";
import React, { useState } from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "../Dropdown";
import { ThemedText } from "../ThemedText";

interface AllowancesSettingsSectionProps {
  allowances: AllowanceItem[];
  currencySymbol: string;
  onSettingsChange: () => void;
}

export const AllowancesSettingsSection: React.FC<AllowancesSettingsSectionProps> = ({
  allowances,
  currencySymbol,
  onSettingsChange,
}) => {
  const { colors } = useTheme();
  const [newAllowance, setNewAllowance] = useState<{
    type: string;
    value: string;
    unit: AllowanceItem["unit"];
  }>({ type: "", value: "", unit: "perShift" });

  const addAllowance = async (): Promise<void> => {
    if (!newAllowance.type || !newAllowance.value) return;
    const valueNum = parseFloat(newAllowance.value.replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(valueNum)) return;
    
    const updatedAllowances = [
      ...allowances,
      {
        id: Date.now().toString(36),
        type: newAllowance.type,
        value: valueNum,
        unit: newAllowance.unit,
      },
    ];
    
    await settingsService.setPayRules({ allowances: updatedAllowances });
    setNewAllowance({ type: "", value: "", unit: "perShift" });
    onSettingsChange();
  };

  const deleteAllowance = async (id: string): Promise<void> => {
    const updatedAllowances = allowances.filter((a) => a.id !== id);
    await settingsService.setPayRules({ allowances: updatedAllowances });
    onSettingsChange();
  };

  const getUnitLabel = (unit: AllowanceItem["unit"]): string => {
    switch (unit) {
      case "perShift":
        return "per shift";
      case "perHour":
        return "per hour";
      case "perKm":
        return "per km";
      default:
        return "per shift";
    }
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
        Allowances
      </ThemedText>

      <View style={styles.content}>
        <View style={styles.rowGap}>
          <TextInput
            placeholder="Type (e.g., Meal Allowance)"
            placeholderTextColor={colors.textSecondary}
            value={newAllowance.type}
            onChangeText={(t) => setNewAllowance((p) => ({ ...p, type: t }))}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
          <View style={styles.inlineInputs}>
            <TextInput
              placeholder={`${currencySymbol} amount`}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textSecondary}
              value={newAllowance.value}
              onChangeText={(t) => setNewAllowance((p) => ({ ...p, value: t }))}
              style={[
                styles.input,
                styles.flex1,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
            <Dropdown
              compact
              placeholder="Unit"
              style={styles.unitDropdown}
              value={newAllowance.unit}
              onChange={(v) => setNewAllowance((p) => ({ ...p, unit: v as AllowanceItem["unit"] }))}
              items={[
                { value: "perShift", label: "Per Shift" },
                { value: "perHour", label: "Per Hour" },
                { value: "perKm", label: "Per KM" },
              ]}
            />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={addAllowance}
          >
            <ThemedText
              style={[styles.actionButtonText, { color: colors.primary }]}
            >
              Add Allowance
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.allowancesList}>
          {allowances?.length ? (
            allowances.map((allowance: AllowanceItem) => (
              <View
                key={allowance.id}
                style={[styles.allowanceRow, { borderColor: colors.border }]}
              >
                <View style={styles.allowanceLabel}>
                  <ThemedText
                    style={styles.allowanceLabelText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {allowance.type}
                  </ThemedText>
                  <ThemedText style={[styles.allowanceUnit, { color: colors.textSecondary }]}>
                    {getUnitLabel(allowance.unit)}
                  </ThemedText>
                </View>
                <View style={styles.allowanceMeta}>
                  <ThemedText>
                    {currencySymbol}
                    {allowance.value.toFixed(2)}
                  </ThemedText>
                  <TouchableOpacity onPress={() => deleteAllowance(allowance.id)}>
                    <ThemedText style={{ color: colors.error }}>
                      Delete
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <ThemedText style={{ color: colors.textSecondary }}>
              No allowances yet. Add one above.
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
  unitDropdown: {
    width: 120,
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
  allowancesList: {
    gap: 8,
  },
  allowanceRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  allowanceLabel: {
    flex: 1,
    minWidth: 0,
  },
  allowanceLabelText: {
    fontWeight: "600",
  },
  allowanceUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  allowanceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
});
