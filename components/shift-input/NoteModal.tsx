import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface NoteModalProps {
  visible: boolean;
  noteText: string;
  onNoteTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  visible,
  noteText,
  onNoteTextChange,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.noteModalOverlay}>
      <View style={[styles.noteModal, { backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.noteModalTitle, { color: colors.text }]}>
          Add break note
        </ThemedText>
        <TextInput
          style={[
            styles.noteInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={noteText}
          onChangeText={onNoteTextChange}
          placeholder="e.g., Lunch, Personal errand"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <View style={styles.noteModalButtons}>
          <TouchableOpacity
            style={[styles.noteCancel, { borderColor: colors.border }]}
            onPress={onCancel}
          >
            <ThemedText style={{ color: colors.text }}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.noteSave, { backgroundColor: colors.primary }]}
            onPress={onSave}
          >
            <ThemedText style={{ color: "white" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = {
  noteModalOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    zIndex: 1000,
  },
  noteModal: {
    backgroundColor: "white", // Will be overridden by theme
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 280,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 16,
    textAlign: "center" as const,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top" as const,
    marginBottom: 16,
    backgroundColor: "white", // Will be overridden by theme
  },
  noteModalButtons: {
    flexDirection: "row" as const,
    gap: 12,
  },
  noteCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    alignItems: "center" as const,
  },
  noteSave: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF", // Will be overridden by theme
    alignItems: "center" as const,
  },
};
