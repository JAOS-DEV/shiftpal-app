import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "white",
  },
  cardTitle: {
    marginBottom: 12,
  },
  loadingSkeleton: {
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: "#EDEDED",
    borderRadius: 8,
  },
  skeletonLineShort: {
    width: "70%",
  },
  skeletonBlock: {
    height: 120,
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    marginTop: 8,
  },
  modeRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
  },
  modeButtonActive: {
    backgroundColor: "#007AFF",
  },
  modeText: {
    fontWeight: "600",
    color: "#8E8E93",
  },
  modeTextActive: {
    color: "white",
  },
});
