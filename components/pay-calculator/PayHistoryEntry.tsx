import { useTheme } from "@/providers/ThemeProvider";
import {
  AppSettings,
  HoursAndMinutes,
  PayCalculationEntry,
} from "@/types/settings";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { PayBreakdownDisplay } from "./PayBreakdownDisplay";

interface PayHistoryEntryProps {
  entry: PayCalculationEntry;
  currencySymbol: string;
  isStale: boolean;
  onRecalculate: (entry: PayCalculationEntry) => void;
  onDelete: (id: string) => void;
  resolveRateValue: (id: string | null | undefined) => number | undefined;
  settings?: AppSettings | null;
}

export const PayHistoryEntry: React.FC<PayHistoryEntryProps> = ({
  entry,
  currencySymbol,
  isStale,
  onRecalculate,
  onDelete,
  resolveRateValue,
  settings,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const hmToMinutes = (hm: HoursAndMinutes | undefined | null): number => {
    const h = Math.max(0, hm?.hours ?? 0);
    const m = Math.max(0, hm?.minutes ?? 0);
    return h * 60 + m;
  };

  const minutesToHMText = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const formatHMClock = (hm: HoursAndMinutes): string => {
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  };

  const formatTimeOfDay = (ts: number): string => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const handleDelete = (): void => {
    const message = "Remove this saved calculation?";
    if (Platform.OS === "web") {
      const ok = typeof window !== "undefined" && window.confirm(message);
      if (!ok) return;
      onDelete(entry.id);
      return;
    }
    Alert.alert("Delete entry", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(entry.id),
      },
    ]);
  };

  const savedBaseVal = resolveRateValue(entry.input.hourlyRateId);
  const baseRateVal =
    (typeof savedBaseVal === "number"
      ? savedBaseVal
      : entry.rateSnapshot?.base) ?? 0;
  const savedOtVal = resolveRateValue(entry.input.overtimeRateId);
  const overtimeRateVal =
    (typeof savedOtVal === "number"
      ? savedOtVal
      : entry.rateSnapshot?.overtime) ?? baseRateVal;

  const baseMinutes = hmToMinutes(entry.input.hoursWorked);
  const overtimeMinutes = hmToMinutes(entry.input.overtimeWorked);
  const totalMinutes = baseMinutes + overtimeMinutes;

  return (
    <View style={styles.entryCard}>
      <TouchableOpacity
        style={[
          styles.entryHeader,
          Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        accessibilityLabel="Toggle entry details"
      >
        <View style={styles.entryHeaderContent}>
          <View style={styles.entrySummary}>
            <ThemedText style={styles.entryTime}>
              Submitted at: {formatTimeOfDay(entry.createdAt)}
            </ThemedText>
            <ThemedText style={styles.entryHours}>
              Hours: {minutesToHMText(totalMinutes)}
            </ThemedText>
          </View>
          <View style={styles.entryTotal}>
            <ThemedText style={styles.entryTotalLabel}>Total</ThemedText>
            <ThemedText style={styles.entryTotalValue}>
              {currencySymbol}
              {entry.calculatedPay.total.toFixed(2)}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.expandIcon}>
          {isExpanded ? "▼" : "▶"}
        </ThemedText>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <PayBreakdownDisplay
            breakdown={entry.calculatedPay}
            currencySymbol={currencySymbol}
            hoursWorked={entry.input.hoursWorked}
            overtimeWorked={entry.input.overtimeWorked}
            baseRate={baseRateVal}
            overtimeRate={overtimeRateVal}
            allowanceItems={settings?.payRules?.allowances || []}
            totalHours={totalMinutes / 60}
            showTitle={false}
          />

          <View style={styles.actionsRow}>
            {isStale && (
              <View style={styles.staleWarning}>
                <ThemedText style={styles.staleText}>
                  Updated tax settings available
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.recalcBtn,
                    Platform.OS === "web"
                      ? ({ cursor: "pointer" } as any)
                      : null,
                  ]}
                  onPress={() => onRecalculate(entry)}
                >
                  <ThemedText style={styles.recalcBtnText}>
                    Recalculate with current settings
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.actionsBtn,
                Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
              ]}
              onPress={handleDelete}
            >
              <ThemedText style={styles.actionsBtnText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  entryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryHeaderContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entrySummary: {
    flex: 1,
  },
  entryTime: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 4,
  },
  entryHours: {
    fontSize: 14,
    color: "#6C757D",
  },
  entryTotal: {
    alignItems: "flex-end",
    marginLeft: 16,
  },
  entryTotalLabel: {
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 2,
  },
  entryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  expandIcon: {
    fontSize: 16,
    color: "#6C757D",
    marginLeft: 12,
  },
  actionsRow: {
    marginTop: 16,
    alignItems: "flex-end",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8F9FA",
  },
  staleWarning: {
    marginBottom: 8,
  },
  staleText: {
    color: "#8E8E93",
  },
  recalcBtn: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignSelf: "flex-start",
  },
  recalcBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  actionsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  actionsBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
