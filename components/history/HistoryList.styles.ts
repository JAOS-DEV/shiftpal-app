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
  skeletonList: {
    gap: 8,
  },
  skeletonRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonBlock: {
    height: 14,
    backgroundColor: "#EDEDED",
    borderRadius: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterButton: {
    // Dynamic colors applied via style prop
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterButtonText: {
    // Dynamic colors applied via style prop
  },
  listContainer: {
    gap: 8,
  },
  retryText: {
    fontWeight: "600",
  },
});
