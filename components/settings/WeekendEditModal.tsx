import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { PayRules, WeekendRules } from "@/types/settings";
import React from "react";
import {
    Modal,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from "../Dropdown";
import { ThemedText } from "../ThemedText";

interface WeekendEditModalProps {
  visible: boolean;
  settings: AppSettings | null;
  onClose: () => void;
  onSettingsChange: () => void;
}

export const WeekendEditModal: React.FC<WeekendEditModalProps> = ({
  visible,
  settings,
  onClose,
  onSettingsChange,
}) => {
  const { colors } = useTheme();
  const [weekendValueText, setWeekendValueText] = React.useState("");

  const updatePayRules = async (updates: Partial<PayRules>): Promise<void> => {
    await settingsService.setPayRules(updates);
    onSettingsChange();
  };

  const getWeekendMode = (): string => {
    const w: WeekendRules = settings?.payRules?.weekend || {};
    return (
      w?.mode ||
      (w?.type === "percentage"
        ? "multiplier"
        : w?.type === "fixed"
        ? "fixed"
        : "multiplier")
    );
  };

  React.useEffect(() => {
    const mode = getWeekendMode();
    const wk = settings?.payRules?.weekend as WeekendRules;
    const wkValue = mode === "multiplier" ? wk?.multiplier : wk?.uplift;
    setWeekendValueText(
      wkValue !== undefined && wkValue !== null ? String(wkValue) : ""
    );
  }, [settings]);

  const handleDayToggle = (day: "Sat" | "Sun"): void => {
    const current = new Set(settings?.payRules?.weekend?.days || []);
    const on = current.has(day);
    if (on) {
      current.delete(day);
    } else {
      current.add(day);
    }
    updatePayRules({
      weekend: {
        ...(settings?.payRules?.weekend || {}),
        days: Array.from(current) as WeekendRules["days"],
      },
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ThemedText
            type="subtitle"
            style={[styles.modalTitle, { color: colors.text }]}
          >
            Edit Weekend
          </ThemedText>
          <View style={styles.toggleRow}>
            <ThemedText style={[styles.flex1, { color: colors.text }]}>
              Enable Weekend
            </ThemedText>
            <Switch
              value={Boolean(settings?.payRules?.weekend?.enabled)}
              onValueChange={(val) =>
                updatePayRules({
                  weekend: {
                    ...(settings?.payRules?.weekend || {}),
                    enabled: val,
                  },
                })
              }
            />
          </View>
          <View style={[styles.inlineInputs, styles.topMargin]}>
            <View style={styles.chipGroup}>
              {(["Sat", "Sun"] as const).map((d) => {
                const on = settings?.payRules?.weekend?.days?.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, on && styles.chipActive]}
                    onPress={() => handleDayToggle(d)}
                  >
                    <ThemedText
                      style={[styles.chipText, on && styles.chipTextActive]}
                    >
                      {d}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={[styles.inlineInputs, styles.topMargin]}>
            <Dropdown
              compact
              placeholder="Mode"
              value={getWeekendMode()}
              onChange={(v) =>
                updatePayRules({
                  weekend: {
                    ...(settings?.payRules?.weekend || {}),
                    mode: v as WeekendRules["mode"],
                  },
                })
              }
              items={[
                { value: "multiplier", label: "Multiplier" },
                { value: "fixed", label: "Fixed uplift" },
              ]}
            />
            <TextInput
              placeholder="Value"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={weekendValueText}
              onChangeText={setWeekendValueText}
              onEndEditing={() => {
                let n = parseFloat(weekendValueText || "0");
                if (Number.isNaN(n)) n = 0;
                const mode = getWeekendMode();
                updatePayRules({
                  weekend: {
                    ...(settings?.payRules?.weekend || {}),
                    [mode === "multiplier" ? "multiplier" : "uplift"]: n,
                  },
                });
                setWeekendValueText(String(n));
              }}
              style={[
                styles.input,
                styles.flex1,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
          </View>
          <TouchableOpacity
            style={[styles.modalButton, { borderColor: colors.primary }]}
            onPress={onClose}
          >
            <ThemedText style={{ color: colors.primary }}>Done</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  inlineInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topMargin: {
    marginTop: 8,
  },
  chipGroup: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#F8F8F8",
  },
  chipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    fontWeight: "600",
    color: "#111",
  },
  chipTextActive: {
    color: "#fff",
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
  modalButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});

