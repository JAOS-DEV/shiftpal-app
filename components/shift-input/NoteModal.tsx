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
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.noteModalOverlay}>
      <View style={styles.noteModal}>
        <ThemedText style={styles.noteModalTitle}>
          Add break note
        </ThemedText>
        <TextInput
          style={styles.noteInput}
          value={noteText}
          onChangeText={onNoteTextChange}
          placeholder="e.g., Lunch, Personal errand"
          placeholderTextColor="#999"
          multiline
        />
        <View style={styles.noteModalButtons}>
          <TouchableOpacity
            style={styles.noteCancel}
            onPress={onCancel}
          >
            <ThemedText>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.noteSave}
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
    backgroundColor: "white",
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
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top" as const,
    marginBottom: 16,
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
    borderColor: "#E5E5EA",
    alignItems: "center" as const,
  },
  noteSave: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center" as const,
  },
};
