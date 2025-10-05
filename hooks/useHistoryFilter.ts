import { PayCalculationEntry } from "@/types/settings";
import { useMemo } from "react";

type PeriodFilter = "week" | "month" | "all";

export const useHistoryFilter = (
  payHistory: PayCalculationEntry[],
  filter: PeriodFilter,
  currentVersion: string
) => {
  const filteredHistory = useMemo(() => {
    if (filter === "all") return payHistory;
    
    const now = new Date();
    const cutoff = new Date();
    
    if (filter === "week") {
      cutoff.setDate(now.getDate() - 7);
    } else if (filter === "month") {
      cutoff.setMonth(now.getMonth() - 1);
    }
    
    return payHistory.filter((entry) => {
      const entryDate = new Date(entry.input.date);
      return entryDate >= cutoff;
    });
  }, [payHistory, filter]);

  const staleCount = useMemo(() => {
    const stale = filteredHistory.filter((entry) => {
      const entryVersion = entry.version || "1.0.0";
      return entryVersion !== currentVersion;
    }).length;
    
    return stale;
  }, [filteredHistory, currentVersion]);

  const hasStaleEntry = useMemo(() => {
    return (entry: PayCalculationEntry) => {
      const entryVersion = entry.version || "1.0.0";
      return entryVersion !== currentVersion;
    };
  }, [currentVersion]);

  return {
    filteredHistory,
    staleCount,
    hasStaleEntry,
  };
};
