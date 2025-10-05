import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    gap: 12,
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
    borderColor: "#E5E5EA",
    backgroundColor: "#F8F8F8",
  },
  validInput: {
    borderColor: "#34C759",
    backgroundColor: "#F0F9F4",
  },
  invalidInput: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
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
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#E5E5EA",
    opacity: 0.5,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButtonText: {
    color: "#999",
  },
  helpContainer: {
    marginTop: 12,
  },
  helpText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.6,
  },
});
