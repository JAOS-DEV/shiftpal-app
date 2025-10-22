import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings, OvertimeRules, PayRules } from "@/types/settings";
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

interface OvertimeEditModalProps {
  visible: boolean;
  settings: AppSettings | null;
  onClose: () => void;
  onSettingsChange: () => void;
}

export const OvertimeEditModal: React.FC<OvertimeEditModalProps> = ({
  visible,
  settings,
  onClose,
  onSettingsChange,
}) => {
  const { colors } = useTheme();

  const updatePayRules = async (updates: Partial<PayRules>): Promise<void> => {
    await settingsService.setPayRules(updates);
    onSettingsChange();
  };

  const getActiveBasis = (): string => {
    return settings?.payRules?.overtime?.active || "daily";
  };

  const getThreshold = (): string => {
    const ot: OvertimeRules = settings?.payRules?.overtime || {};
    const rule = getActiveBasis() === "weekly" ? ot.weekly : ot.daily;
    return rule?.threshold != null ? String(rule.threshold) : "";
  };

  const handleBasisChange = (v: string): void => {
    updatePayRules({
      overtime: {
        ...(settings?.payRules?.overtime as any),
        active: v as any,
      } as any,
    });
  };

  const handleThresholdChange = (t: string): void => {
    const n = Math.max(0, parseFloat(t.replace(/[^0-9.]/g, "")) || 0);
    const ot: any = settings?.payRules?.overtime || {};
    const active = getActiveBasis();
    updatePayRules({
      overtime: {
        ...ot,
        [active]: { ...(ot[active] || {}), threshold: n },
        enabled: settings?.payRules?.overtime?.enabled !== false,
      } as any,
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
            Edit Overtime
          </ThemedText>

          {/* Enable Toggle */}
          <View style={styles.enableRow}>
            <ThemedText style={[styles.enableLabel, { color: colors.text }]}>
              Enable Overtime
            </ThemedText>
            <Switch
              value={Boolean(settings?.payRules?.overtime?.enabled)}
              onValueChange={(val) => {
                updatePayRules({
                  overtime: {
                    ...(settings?.payRules?.overtime as any),
                    enabled: val,
                  } as any,
                });
              }}
            />
          </View>

          <View style={styles.inlineInputs}>
            <Dropdown
              compact
              placeholder="Basis"
              value={getActiveBasis()}
              onChange={handleBasisChange}
              items={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
            <TextInput
              placeholder="Threshold (h)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={getThreshold()}
              onChangeText={handleThresholdChange}
              style={[
                styles.input,
                styles.flex1,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
          </View>

          <ThemedText
            style={[styles.helpText, { color: colors.textSecondary }]}
          >
            Hours above this threshold will be calculated at your overtime pay
            rate
          </ThemedText>
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
  enableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  enableLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  helpText: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
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
  modalButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
