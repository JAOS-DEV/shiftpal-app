import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    backgroundColor: "white", // Will be overridden by theme
  },
  cardTitle: {
    marginBottom: 12,
  },
  loadingSkeleton: {
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: "#EDEDED", // Will be overridden by theme
    borderRadius: 8,
  },
  skeletonLineShort: {
    width: "70%",
  },
  skeletonBlock: {
    height: 120,
    backgroundColor: "#F3F3F3", // Will be overridden by theme
    borderRadius: 12,
    marginTop: 8,
  },
  modeRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    overflow: "hidden",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white", // Will be overridden by theme
  },
  modeButtonActive: {
    backgroundColor: "#007AFF", // Will be overridden by theme
  },
  modeText: {
    fontWeight: "600",
    color: "#8E8E93", // Will be overridden by theme
  },
  modeTextActive: {
    color: "white", // Will be overridden by theme
  },
  existingCalculationBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9500", // Will be overridden by theme
    backgroundColor: "#FF950020", // Will be overridden by theme
  },
  existingCalculationText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  existingCalculationSubtext: {
    fontSize: 12,
    lineHeight: 16,
  },
});
