import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings, HoursAndMinutes, PayCalculationEntry } from "@/types/settings";
import { notify } from "@/utils/notify";
import { formatDateDisplay } from "@/utils/timeUtils";
import React, { useMemo, useState } from "react";
import {
    StyleSheet,
    View
} from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { PayHistoryEntry as PayHistoryEntryComponent } from "./PayHistoryEntry";
import { PayPeriodFilter } from "./PayPeriodFilter";
import { PaySummaryCard } from "./PaySummaryCard";

type PeriodFilter = "week" | "month" | "all";

interface PayHistoryTabProps {
  settings: AppSettings | null;
  payHistory: PayCalculationEntry[];
  loadingHistory: boolean;
  currentVersion: string;
  onHistoryUpdated: () => Promise<void>;
}

export const PayHistoryTab: React.FC<PayHistoryTabProps> = ({
  settings,
  payHistory,
  loadingHistory,
  currentVersion,
  onHistoryUpdated,
}) => {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<PeriodFilter>("week");
  const [pendingUndo, setPendingUndo] = useState<{
    ids: string[];
    prev: PayCalculationEntry[];
  } | null>(null);

  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );

  const startOfToday = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const isInCurrentWeek = (ts: number): boolean => {
    const d = new Date(ts);
    const now = startOfToday();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return d >= monday && d <= sunday;
  };

  const isInCurrentMonth = (ts: number): boolean => {
    const d = new Date(ts);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  };

  const filteredHistory = useMemo(() => {
    if (period === "all") return payHistory;
    if (period === "week")
      return payHistory.filter((e) => isInCurrentWeek(e.createdAt));
    return payHistory.filter((e) => isInCurrentMonth(e.createdAt));
  }, [payHistory, period]);

  const hmToMinutes = (hm: HoursAndMinutes | undefined | null): number => {
    const h = Math.max(0, hm?.hours ?? 0);
    const m = Math.max(0, hm?.minutes ?? 0);
    return h * 60 + m;
  };

  const summary = useMemo(() => {
    const totals = filteredHistory.reduce(
      (acc, e) => {
        acc.base += e.calculatedPay.base;
        acc.overtime += e.calculatedPay.overtime;
        acc.uplifts += e.calculatedPay.uplifts;
        acc.allowances += e.calculatedPay.allowances;
        acc.gross +=
          e.calculatedPay.gross ??
          e.calculatedPay.base +
            e.calculatedPay.overtime +
            e.calculatedPay.uplifts +
            e.calculatedPay.allowances;
        acc.tax += e.calculatedPay.tax ?? 0;
        acc.ni += e.calculatedPay.ni ?? 0;
        acc.total += e.calculatedPay.total;
        acc.minutes +=
          hmToMinutes(e.input.hoursWorked) +
          hmToMinutes(e.input.overtimeWorked);
        return acc;
      },
      {
        base: 0,
        overtime: 0,
        uplifts: 0,
        allowances: 0,
        gross: 0,
        tax: 0,
        ni: 0,
        total: 0,
        minutes: 0,
      }
    );
    return totals;
  }, [filteredHistory]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, PayCalculationEntry[]>();
    for (const entry of filteredHistory) {
      const key = entry.input.date;
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }
    const sorted = Array.from(map.entries()).sort((a, b) =>
      a[0] < b[0] ? 1 : -1
    );
    return sorted;
  }, [filteredHistory]);

  const hasStaleEntry = (entry: PayCalculationEntry): boolean =>
    (!!entry.settingsVersion &&
      !!currentVersion &&
      entry.settingsVersion !== currentVersion) ||
    (!entry.settingsVersion && !!currentVersion);

  const staleCount = useMemo(() => {
    let stale = 0;
    for (const e of filteredHistory) if (hasStaleEntry(e)) stale++;
    return stale;
  }, [filteredHistory, currentVersion]);

  const handleRecalcEntry = async (entry: PayCalculationEntry): Promise<void> => {
    const before = entry;
    const next = await settingsService.recomputeEntry(entry);
    await settingsService.updateHistoryEntry(next);
    await onHistoryUpdated();
    setPendingUndo({ ids: [entry.id], prev: [before] });
    notify.success("Recalculated", "Entry updated • Undo available");
  };

  const handleRecalcAll = async (): Promise<void> => {
    const staleIds = filteredHistory
      .filter((e) => hasStaleEntry(e))
      .map((e) => e.id);
    if (staleIds.length === 0) return;

    const snapshot = payHistory.filter((e) => staleIds.includes(e.id));
    await settingsService.recomputeMany(staleIds);
    await onHistoryUpdated();
    setPendingUndo({ ids: staleIds, prev: snapshot });
    notify.success(
      "Recalculated",
      `${staleIds.length} entr${
        staleIds.length === 1 ? "y" : "ies"
      } updated • Undo available`
    );
  };

  const handleUndo = async (): Promise<void> => {
    if (!pendingUndo) return;
    const { prev } = pendingUndo;
    for (const entry of prev) {
      await settingsService.updateHistoryEntry(entry);
    }
    await onHistoryUpdated();
    setPendingUndo(null);
    notify.info("Undone");
  };

  const handleDelete = async (id: string): Promise<void> => {
    await settingsService.deletePayCalculation(id);
    await onHistoryUpdated();
    notify.info("Deleted");
  };

  const resolveRateValue = (id: string | null | undefined): number | undefined => {
    if (!id) return undefined;
    const list = settings?.payRates || [];
    return list.find((r) => r.id === id)?.value;
  };

  if (loadingHistory) {
    return (
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Loading history…
        </ThemedText>
      </View>
    );
  }

  if (payHistory.length === 0) {
    return (
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          No history yet
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Save pay calculations to see them here
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView>
      <PayPeriodFilter
        activePeriod={period}
        onPeriodChange={setPeriod}
        staleCount={staleCount}
        onRecalcAll={handleRecalcAll}
        onUndo={pendingUndo ? handleUndo : null}
      />

      {filteredHistory.length > 0 && (
        <PaySummaryCard
          summary={summary}
          currencySymbol={currencySymbol}
          period={period}
          settings={settings}
        />
      )}

      {filteredHistory.length === 0 ? (
        <View style={styles.card}>
          <ThemedText style={styles.emptyText}>
            No entries for this period
          </ThemedText>
        </View>
      ) : (
        <View style={styles.historyList}>
          {groupedByDate.map(([dateKey, entries]) => (
            <View key={dateKey} style={styles.dayGroup}>
              <ThemedText style={styles.dayGroupDate}>
                {formatDateDisplay(dateKey)}
              </ThemedText>
              {entries.map((entry) => (
                <PayHistoryEntryComponent
                  key={entry.id}
                  entry={entry}
                  currencySymbol={currencySymbol}
                  isStale={hasStaleEntry(entry)}
                  onRecalculate={handleRecalcEntry}
                  onDelete={handleDelete}
                  resolveRateValue={resolveRateValue}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
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
  emptyText: {
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 8,
  },
  historyList: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  dayGroup: {
    marginBottom: 24,
  },
  dayGroupDate: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
});

