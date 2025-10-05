import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  dayRow: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  daySubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
  dayTotals: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  dayTotalText: {
    fontSize: 16,
    fontWeight: "700",
  },
  dayTotalMinutes: {
    fontSize: 12,
    opacity: 0.6,
  },
  dayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionsTrigger: {},
  actionsTriggerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  expandIcon: {
    fontSize: 12,
    opacity: 0.6,
  },
  shiftsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  submissionCount: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  submissionTotalRow: {
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submissionTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  submissionTotalValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  breakSummaryText: {
    fontSize: 12,
    marginTop: 4,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuContainer: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    paddingVertical: 8,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
  },
  menuItemTextDestructive: {
    fontSize: 14,
    fontWeight: "600",
  },
});
