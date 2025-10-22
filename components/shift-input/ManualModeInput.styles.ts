import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  timeInputContainer: {
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    opacity: 0.8,
  },
  timeInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  defaultInput: {
    borderColor: "#E5E5EA", // Will be overridden by theme
    backgroundColor: "#F8F8F8", // Will be overridden by theme
  },
  validInput: {
    borderColor: "#34C759", // Will be overridden by theme
    backgroundColor: "#F0F9F4", // Will be overridden by theme
  },
  invalidInput: {
    borderColor: "#FF3B30", // Will be overridden by theme
    backgroundColor: "#FFF5F5", // Will be overridden by theme
  },
  previewContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  previewText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#007AFF", // Will be overridden by theme
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#E5E5EA", // Will be overridden by theme
    opacity: 0.5,
  },
  addButtonText: {
    color: "white", // Will be overridden by theme
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButtonText: {
    color: "#999", // Will be overridden by theme
  },
  helpContainer: {
    marginTop: 12,
  },
  helpText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    alignItems: "center",
  },
  noteButton: {
    flex: 1,
    backgroundColor: "#F2F2F7", // Will be overridden by theme
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    minHeight: 48,
    justifyContent: "center",
  },
  noteButtonText: {
    color: "#007AFF", // Will be overridden by theme
    fontSize: 16,
    fontWeight: "600",
  },
});
