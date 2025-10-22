import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  dayCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
    backgroundColor: "white", // Will be overridden by theme
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayHeaderContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  daySummary: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  daySubtext: {
    fontSize: 14,
    color: "#6C757D", // Will be overridden by theme
  },
  dayTotal: {
    alignItems: "flex-end",
    marginLeft: 16,
  },
  dayTotalLabel: {
    fontSize: 12,
    color: "#6C757D", // Will be overridden by theme
    marginBottom: 2,
  },
  dayTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF", // Will be overridden by theme
  },
  expandIcon: {
    fontSize: 16,
    color: "#6C757D", // Will be overridden by theme
    marginLeft: 12,
  },
  shiftsContainer: {
    marginTop: 16,
  },
  submissionCount: {
    fontSize: 12,
    color: "#6C757D", // Will be overridden by theme
    marginBottom: 8,
  },
  submissionTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#F8F9FA", // Will be overridden by theme
    marginTop: 12,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submissionTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D", // Will be overridden by theme
  },
  submissionTotalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000", // Will be overridden by theme
  },
  breakSummaryText: {
    fontSize: 12,
    color: "#6C757D", // Will be overridden by theme
    marginTop: 8,
  },
  actionsRow: {
    marginTop: 16,
    alignItems: "flex-end",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8F9FA", // Will be overridden by theme
  },
  actionsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA", // Will be overridden by theme
  },
  actionsBtnText: {
    color: "#007AFF", // Will be overridden by theme
    fontWeight: "600",
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
