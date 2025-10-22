import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    backgroundColor: "#F8F8F8", // Will be overridden by theme
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#007AFF", // Will be overridden by theme
    borderColor: "#007AFF", // Will be overridden by theme
  },
  modeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111", // Will be overridden by theme
  },
  modeTextActive: {
    color: "#fff", // Will be overridden by theme
  },
});
