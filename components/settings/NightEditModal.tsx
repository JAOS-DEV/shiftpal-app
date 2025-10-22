import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings, PayRules } from "@/types/settings";
import React, { useMemo } from "react";
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

interface NightEditModalProps {
  visible: boolean;
  settings: AppSettings | null;
  onClose: () => void;
  onSettingsChange: () => void;
}

export const NightEditModal: React.FC<NightEditModalProps> = ({
  visible,
  settings,
  onClose,
  onSettingsChange,
}) => {
  const { colors } = useTheme();
  const [nightValueText, setNightValueText] = React.useState("");

  const hoursOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const s = String(i).padStart(2, "0");
        return { value: s, label: s };
      }),
    []
  );

  const minutesOptions = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const s = String(i).padStart(2, "0");
        return { value: s, label: s };
      }),
    []
  );

  const splitTime = (t?: string | null): { h: string; m: string } => {
    const def = { h: "00", m: "00" };
    if (!t || typeof t !== "string" || !t.includes(":")) return def;
    const [h, m] = t.split(":");
    const hh = String(
      Math.min(23, Math.max(0, parseInt(h || "0", 10) || 0))
    ).padStart(2, "0");
    const mm = String(
      Math.min(59, Math.max(0, parseInt(m || "0", 10) || 0))
    ).padStart(2, "0");
    return { h: hh, m: mm };
  };

  const joinTime = (h: string, m: string): string =>
    `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;

  const updatePayRules = async (updates: Partial<PayRules>): Promise<void> => {
    await settingsService.setPayRules(updates);
    onSettingsChange();
  };

  React.useEffect(() => {
    const mode = settings?.payRules?.night?.mode || "fixed";
    const value =
      mode === "multiplier"
        ? settings?.payRules?.night?.multiplier
        : settings?.payRules?.night?.uplift;
    setNightValueText(
      value !== undefined && value !== null ? String(value) : ""
    );
  }, [settings]);

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
            Edit Night
          </ThemedText>
          <View style={styles.toggleRow}>
            <ThemedText style={[styles.flex1, { color: colors.text }]}>
              Enable Night
            </ThemedText>
            <Switch
              value={Boolean(settings?.payRules?.night?.enabled)}
              onValueChange={(val) =>
                updatePayRules({
                  night: {
                    ...(settings?.payRules?.night || {}),
                    enabled: val,
                  },
                })
              }
            />
          </View>
          <View style={[styles.inlineInputs, styles.topMargin]}>
            <Dropdown
              compact
              placeholder="Start HH"
              value={splitTime(settings?.payRules?.night?.start).h}
              onChange={(v) =>
                updatePayRules({
                  night: {
                    ...(settings?.payRules?.night || {}),
                    start: joinTime(
                      String(v),
                      splitTime(settings?.payRules?.night?.start).m
                    ),
                  },
                })
              }
              items={hoursOptions}
            />
            <Dropdown
              compact
              placeholder="MM"
              value={splitTime(settings?.payRules?.night?.start).m}
              onChange={(v) =>
                updatePayRules({
                  night: {
                    ...(settings?.payRules?.night || {}),
                    start: joinTime(
                      splitTime(settings?.payRules?.night?.start).h,
                      String(v)
                    ),
                  },
                })
              }
              items={minutesOptions}
            />
            <ThemedText style={styles.arrow}>→</ThemedText>
            <Dropdown
              compact
              placeholder="End HH"
              value={splitTime(settings?.payRules?.night?.end).h}
              onChange={(v) =>
                updatePayRules({
                  night: {
                    ...(settings?.payRules?.night || {}),
                    end: joinTime(
                      String(v),
                      splitTime(settings?.payRules?.night?.end).m
                    ),
                  },
                })
              }
              items={hoursOptions}
            />
            <Dropdown
              compact
              placeholder="MM"
              value={splitTime(settings?.payRules?.night?.end).m}
              onChange={(v) =>
                updatePayRules({
                  night: {
                    ...(settings?.payRules?.night || {}),
                    end: joinTime(
                      splitTime(settings?.payRules?.night?.end).h,
                      String(v)
                    ),
                  },
                })
              }
              items={minutesOptions}
            />
          </View>
          <View style={[styles.inlineInputs, styles.topMargin]}>
            <Dropdown
              compact
              placeholder="Mode"
              value={settings?.payRules?.night?.mode || "fixed"}
              onChange={(v) =>
                updatePayRules({
                  night: {
                    ...(settings?.payRules?.night || {}),
                    mode: v as "fixed" | "multiplier",
                  },
                })
              }
              items={[
                { value: "fixed", label: "Fixed uplift" },
                { value: "multiplier", label: "Multiplier" },
              ]}
            />
            <TextInput
              placeholder="Value"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={nightValueText}
              onChangeText={setNightValueText}
              onEndEditing={() => {
                let n = parseFloat(nightValueText || "0");
                if (Number.isNaN(n)) n = 0;
                const mode = settings?.payRules?.night?.mode || "fixed";
                updatePayRules({
                  night: {
                    ...(settings?.payRules?.night || {}),
                    [mode === "multiplier" ? "multiplier" : "uplift"]: n,
                  },
                });
                setNightValueText(String(n));
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  flex1: {
    flex: 1,
  },
  arrow: {
    opacity: 0.6,
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
