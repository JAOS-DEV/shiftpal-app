import { useTheme } from "@/providers/ThemeProvider";
import React, { useCallback, useMemo, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export interface DropdownItem {
  value: string;
  label: string;
}

interface DropdownProps {
  label?: string;
  value?: string | null;
  items: DropdownItem[];
  onChange: (value: string) => void;
  placeholder?: string;
  style?: object; // optional trigger container style override
  compact?: boolean; // reduce paddings to better match small inputs
}

export function Dropdown({
  label,
  value,
  items,
  onChange,
  placeholder,
  style,
  compact = false,
}: DropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const selectedLabel = useMemo(
    () => items.find((i) => i.value === value)?.label,
    [items, value]
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleItemSelect = useCallback((itemValue: string) => {
    onChange(itemValue);
    setOpen(false);
  }, [onChange]);

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
              {items.map((it) => (
                <TouchableOpacity
                  key={it.value}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    value === it.value && [
                      styles.optionActive,
                      { backgroundColor: colors.card },
                    ],
                  ]}
                  onPress={() => handleItemSelect(it.value)}
                >
                  <ThemedText
                    style={[styles.optionText, { color: colors.text }]}
                  >
                    {it.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
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
