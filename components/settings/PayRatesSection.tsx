import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { PayRate, PayRateType } from "@/types/settings";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "../ui/Dropdown";
import { ThemedText } from "../ui/ThemedText";

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
  const [showLabelError, setShowLabelError] = useState(false);
  const [showValueError, setShowValueError] = useState(false);

  const addRate = async (): Promise<void> => {
    // Reset error states
    setShowLabelError(false);
    setShowValueError(false);

    let hasError = false;

    // Validate rate name first
    if (!newRate.label.trim()) {
      setShowLabelError(true);
      hasError = true;
    }

    // Validate rate value
    if (!newRate.value.trim()) {
      setShowValueError(true);
      return;
    }

    const valueNum = parseFloat(newRate.value.replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(valueNum) || valueNum <= 0) {
      setShowValueError(true);
      return;
    }

    // If label is missing, don't proceed
    if (hasError) {
      return;
    }

    try {
      await settingsService.addPayRate({
        label: newRate.label.trim(),
        value: valueNum,
        type: newRate.type,
      });
      setNewRate({ label: "", value: "", type: "base" });
      setShowLabelError(false);
      setShowValueError(false);
      onRatesChange();
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to save the pay rate. Please try again."
      );
      console.error("Error saving pay rate:", error);
    }
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
          <View>
            <TextInput
              placeholder="Label (e.g., Standard Rate)"
              placeholderTextColor={colors.textSecondary}
              value={newRate.label}
              onChangeText={(t) => {
                setNewRate((p) => ({ ...p, label: t }));
                setShowLabelError(false);
              }}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: showLabelError
                    ? colors.error || "#ef4444"
                    : colors.border,
                },
              ]}
            />
            {showLabelError && (
              <ThemedText
                style={[
                  styles.errorText,
                  { color: colors.error || "#ef4444" },
                ]}
              >
                Rate name is required
              </ThemedText>
            )}
          </View>
          <View style={styles.inlineInputs}>
            <View style={styles.flex1}>
              <TextInput
                placeholder={`${currencySymbol} / hour`}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textSecondary}
                value={newRate.value}
                onChangeText={(t) => {
                  setNewRate((p) => ({ ...p, value: t }));
                  setShowValueError(false);
                }}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: showValueError
                      ? colors.error || "#ef4444"
                      : colors.border,
                  },
                ]}
              />
              {showValueError && (
                <ThemedText
                  style={[
                    styles.errorText,
                    { color: colors.error || "#ef4444" },
                  ]}
                >
                  Valid rate value is required
                </ThemedText>
              )}
            </View>
            <Dropdown
              compact
              placeholder="Type"
              style={styles.typeDropdown}
              value={newRate.type}
              onChange={(v) =>
                setNewRate((p) => ({ ...p, type: v as PayRateType }))
              }
              items={[
                { value: "base", label: "Standard" },
                { value: "overtime", label: "Overtime" },
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
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
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
