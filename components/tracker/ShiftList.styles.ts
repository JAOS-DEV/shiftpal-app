import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
  },
  listContainer: {
    gap: 8,
  },
  shiftRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8", // Will be overridden by theme
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
  },
  shiftInfo: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  shiftNumber: {
    fontSize: 12,
    opacity: 0.6,
    backgroundColor: "#E5E5EA", // Will be overridden by theme
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#34C759", // Will be overridden by theme
  },
  minutesText: {
    fontSize: 12,
    opacity: 0.6,
  },
  breakText: {
    fontSize: 12,
    opacity: 0.6,
  },
  noteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA", // Will be overridden by theme
  },
  noteText: {
    fontSize: 13,
    fontStyle: "italic",
    opacity: 0.7,
    color: "#666", // Will be overridden by theme
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  removeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  separator: {
    height: 8,
  },
});

