import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ui/ThemedText";

interface HelpModalProps {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  visible,
  title,
  body,
  onClose,
}) => {
  const { colors } = useTheme();

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
            {title}
          </ThemedText>
          <ThemedText style={[styles.modalBody, { color: colors.text }]}>
            {body}
          </ThemedText>
          <TouchableOpacity
            style={[styles.modalButton, { borderColor: colors.primary }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.modalButtonText, { color: colors.primary }]}>Close</ThemedText>
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
  modalButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalBody: {
    fontSize: 16,
    lineHeight: 22,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

