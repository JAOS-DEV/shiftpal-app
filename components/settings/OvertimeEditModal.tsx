import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { OvertimeRules, PayRules } from "@/types/settings";
import React from "react";
import {
    Modal,
    StyleSheet,
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

  const getMode = (): string => {
    const ot: OvertimeRules = settings?.payRules?.overtime || {};
    const active = getActiveBasis();
    return (ot[active as keyof OvertimeRules] as any)?.mode || "fixed";
  };

  const getValue = (): string => {
    const ot: OvertimeRules = settings?.payRules?.overtime || {};
    const active = getActiveBasis();
    const rule = ot[active as keyof OvertimeRules] as any;
    return String(
      (rule?.mode || "fixed") === "multiplier" ? rule?.multiplier ?? "" : rule?.uplift ?? ""
    );
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
        enabled: true,
      } as any,
    });
  };

  const handleModeChange = (v: string): void => {
    const ot: any = settings?.payRules?.overtime || {};
    const active = getActiveBasis();
    updatePayRules({
      overtime: {
        ...ot,
        [active]: { ...(ot[active] || {}), mode: v as any },
        enabled: true,
      } as any,
    });
  };

  const handleValueChange = (t: string): void => {
    const ot: any = settings?.payRules?.overtime || {};
    const active = getActiveBasis();
    const r = ot[active] || {};
    const isMul = (r.mode || "fixed") === "multiplier";
    const n = parseFloat(t.replace(/[^0-9.]/g, ""));
    updatePayRules({
      overtime: {
        ...ot,
        [active]: {
          ...r,
          [isMul ? "multiplier" : "uplift"]: isNaN(n) ? undefined : n,
        },
        enabled: true,
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
          <View style={styles.inlineInputs}>
            <Dropdown
              compact
              placeholder="Mode"
              value={getMode()}
              onChange={handleModeChange}
              items={[
                { value: "fixed", label: "Fixed uplift" },
                { value: "multiplier", label: "Multiplier" },
              ]}
            />
            <TextInput
              placeholder="Value"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={getValue()}
              onChangeText={handleValueChange}
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

