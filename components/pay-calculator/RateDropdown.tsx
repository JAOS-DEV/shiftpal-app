import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { PayRateType } from "@/types/settings";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

export interface RateDropdownItem {
  value: string;
  label: string;
}

interface RateDropdownProps {
  label?: string;
  value?: string | null;
  items: RateDropdownItem[];
  onChange: (value: string) => void;
  onCustomChange?: (value: string) => void;
  placeholder?: string;
  customPlaceholder?: string;
  currencySymbol?: string;
  rateType: PayRateType;
  style?: object;
  compact?: boolean;
}

export function RateDropdown({
  label,
  value,
  items,
  onChange,
  onCustomChange,
  placeholder,
  customPlaceholder,
  currencySymbol = "$",
  rateType,
  style,
  compact = false,
}: RateDropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [customName, setCustomName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { colors } = useTheme();

  const selectedLabel = useMemo(() => {
    if (value === "custom") {
      return customValue ? `${currencySymbol}${customValue}` : "Add Rate";
    }
    return items.find((i) => i.value === value)?.label;
  }, [items, value, customValue, currencySymbol]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleItemSelect = useCallback(
    (itemValue: string) => {
      if (itemValue === "custom") {
        // Don't close modal when custom is selected, allow input
        return;
      }
      onChange(itemValue);
      setOpen(false);
    },
    [onChange]
  );

  const handleCustomInputChange = useCallback(
    (text: string) => {
      setCustomValue(text);
      if (onCustomChange) {
        onCustomChange(text);
      }
    },
    [onCustomChange]
  );

  const handleCustomSubmit = useCallback(async () => {
    if (!customValue.trim() || !customName.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both a rate value and a name for your custom rate."
      );
      return;
    }

    const rateValue = parseFloat(customValue);
    if (isNaN(rateValue) || rateValue <= 0) {
      Alert.alert(
        "Invalid Rate",
        "Please enter a valid positive number for the rate."
      );
      return;
    }

    setIsSaving(true);
    try {
      const newRate = await settingsService.addPayRate({
        label: customName.trim(),
        value: rateValue,
        type: rateType,
      });

      // Clear the custom inputs
      setCustomValue("");
      setCustomName("");

      // Select the newly created rate
      onChange(newRate.id);
      setOpen(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save the custom rate. Please try again.");
      console.error("Error saving custom rate:", error);
    } finally {
      setIsSaving(false);
    }
  }, [customValue, customName, rateType, onChange]);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          compact && styles.triggerCompact,
          { borderColor: colors.border, backgroundColor: colors.surface },
          style,
        ]}
        onPress={handleOpen}
        accessibilityLabel={label ? `${label} dropdown` : "dropdown"}
      >
        {label ? (
          <ThemedText
            style={[styles.triggerLabel, { color: colors.textSecondary }]}
          >
            {label}
          </ThemedText>
        ) : null}
        <View style={styles.triggerValueRow}>
          <ThemedText
            style={[styles.triggerValue, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedLabel || placeholder || "Select"}
          </ThemedText>
          <ThemedText style={[styles.caret, { color: colors.textSecondary }]}>
            ▼
          </ThemedText>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <ThemedView
            style={[styles.sheet, { backgroundColor: colors.surface }]}
          >
            <ScrollView style={styles.scrollView}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    value === item.value && [
                      styles.optionActive,
                      { backgroundColor: colors.card },
                    ],
                  ]}
                  onPress={() => handleItemSelect(item.value)}
                >
                  <ThemedText
                    style={[styles.optionText, { color: colors.text }]}
                  >
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}

              {/* Custom input section */}
              <View
                style={[
                  styles.customSection,
                  { borderTopColor: colors.border },
                ]}
              >
                <ThemedText
                  style={[styles.customLabel, { color: colors.textSecondary }]}
                >
                  Add New {rateType === "base" ? "Base" : "Overtime"} Rate
                </ThemedText>

                {/* Name input */}
                <View style={styles.inputGroup}>
                  <ThemedText
                    style={[styles.inputLabel, { color: colors.textSecondary }]}
                  >
                    Rate Name
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.customInput,
                      { borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder={`e.g., "Weekend ${
                      rateType === "base" ? "Base" : "Overtime"
                    }"`}
                    placeholderTextColor="#6B7280"
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                {/* Value input */}
                <View style={styles.inputGroup}>
                  <ThemedText
                    style={[styles.inputLabel, { color: colors.textSecondary }]}
                  >
                    Rate Value
                  </ThemedText>
                  <View style={styles.customInputRow}>
                    <TextInput
                      style={[
                        styles.customInput,
                        { borderColor: colors.border, color: colors.text },
                      ]}
                      keyboardType={
                        Platform.OS === "web" ? "default" : "decimal-pad"
                      }
                      placeholder={customPlaceholder || `${currencySymbol}0.00`}
                      placeholderTextColor="#6B7280"
                      value={customValue}
                      onChangeText={handleCustomInputChange}
                      onSubmitEditing={handleCustomSubmit}
                    />
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={handleCustomSubmit}
                      disabled={
                        !customValue.trim() || !customName.trim() || isSaving
                      }
                    >
                      <ThemedText style={styles.submitButtonText}>
                        {isSaving ? "Saving..." : "Save"}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <ThemedText style={[styles.closeBtnText, { color: colors.text }]}>
                Close
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    maxWidth: "100%",
    height: 41,
  },
  triggerCompact: {
    paddingVertical: 8,
    height: 41,
  },
  triggerLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  triggerValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  triggerValue: {
    fontWeight: "600",
    flex: 1,
    overflow: "hidden",
  },
  caret: {
    opacity: 0.6,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 0,
    textAlign: "center",
    minWidth: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    borderRadius: 12,
    overflow: "hidden",
    padding: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  optionActive: {
    backgroundColor: "#F2F2F7",
  },
  optionText: {
    fontSize: 16,
  },
  customSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  customLabel: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "500",
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  closeBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeBtnText: {
    fontWeight: "600",
  },
  scrollView: {
    maxHeight: 300,
  },
});
