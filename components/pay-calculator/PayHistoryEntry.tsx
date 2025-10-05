import { useTheme } from "@/providers/ThemeProvider";
import { HoursAndMinutes, PayCalculationEntry } from "@/types/settings";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

interface PayHistoryEntryProps {
  entry: PayCalculationEntry;
  currencySymbol: string;
  isStale: boolean;
  onRecalculate: (entry: PayCalculationEntry) => void;
  onDelete: (id: string) => void;
  resolveRateValue: (id: string | null | undefined) => number | undefined;
}

export const PayHistoryEntry: React.FC<PayHistoryEntryProps> = ({
  entry,
  currencySymbol,
  isStale,
  onRecalculate,
  onDelete,
  resolveRateValue,
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
  const baseAmount = baseRateVal * (baseMinutes / 60);
  const overtimeAmount = overtimeRateVal * (overtimeMinutes / 60);
  const overtimeAmountFinal = Number((entry.calculatedPay as any).overtime ?? 0);
  const upliftsAmount = Number((entry.calculatedPay as any).uplifts ?? 0);
  const allowancesAmount = Number((entry.calculatedPay as any).allowances ?? 0);
  const totalBeforeDeductions =
    (entry.calculatedPay as any).gross ??
    entry.calculatedPay.base +
      entry.calculatedPay.overtime +
      entry.calculatedPay.uplifts +
      entry.calculatedPay.allowances;
  const totalMinutes = baseMinutes + overtimeMinutes;

  return (
    <View style={styles.entryContainer}>
      <TouchableOpacity
        style={[
          styles.entryHeader,
          Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        accessibilityLabel="Toggle entry details"
      >
        <View style={styles.flex1}>
          <ThemedText style={styles.entrySubmittedAt}>
            Submitted at: {formatTimeOfDay(entry.createdAt)}
          </ThemedText>
          <ThemedText style={styles.finalTotalText}>
            Final Total: {currencySymbol}
            {entry.calculatedPay.total.toFixed(2)}
          </ThemedText>
          <ThemedText style={styles.entryCollapsedMeta}>
            Hours: {minutesToHMText(totalMinutes)}
          </ThemedText>
        </View>
        <ThemedText style={styles.expandIconSmall}>
          {isExpanded ? "▼" : "▶"}
        </ThemedText>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <ThemedText style={styles.entryTotalBefore}>
            Total (before deductions): {currencySymbol}
            {totalBeforeDeductions.toFixed(2)}
          </ThemedText>

          <View style={styles.lineItemRow}>
            <ThemedText style={styles.lineItemLabel}>Standard:</ThemedText>
            <ThemedText style={styles.lineItemValue}>
              {formatHMClock(entry.input.hoursWorked)} @ {currencySymbol}
              {baseRateVal.toFixed(2)}
            </ThemedText>
          </View>
          <ThemedText style={styles.lineItemAmount}>
            {currencySymbol}
            {baseAmount.toFixed(2)}
          </ThemedText>

          {overtimeMinutes > 0 && (
            <>
              <View style={styles.lineItemRow}>
                <ThemedText style={styles.lineItemLabel}>Overtime:</ThemedText>
                <ThemedText style={styles.lineItemValue}>
                  {formatHMClock(entry.input.overtimeWorked)} @ {currencySymbol}
                  {overtimeRateVal.toFixed(2)}
                </ThemedText>
              </View>
              <ThemedText style={styles.lineItemAmount}>
                {currencySymbol}
                {overtimeAmountFinal
                  ? overtimeAmountFinal.toFixed(2)
                  : overtimeAmount.toFixed(2)}
              </ThemedText>
            </>
          )}

          {upliftsAmount > 0 && (
            <View style={styles.lineItemRow}>
              <ThemedText style={styles.lineItemLabel}>Uplifts:</ThemedText>
              <ThemedText style={styles.lineItemValue}>
                {currencySymbol}
                {upliftsAmount.toFixed(2)}
              </ThemedText>
            </View>
          )}

          {allowancesAmount > 0 && (
            <View style={styles.lineItemRow}>
              <ThemedText style={styles.lineItemLabel}>Allowances:</ThemedText>
              <ThemedText style={styles.lineItemValue}>
                {currencySymbol}
                {allowancesAmount.toFixed(2)}
              </ThemedText>
            </View>
          )}

          <ThemedText style={styles.deductionText}>
            Tax: {currencySymbol}
            {Number((entry.calculatedPay as any).tax ?? 0).toFixed(2)}
          </ThemedText>
          <ThemedText style={styles.deductionText}>
            NI: {currencySymbol}
            {Number((entry.calculatedPay as any).ni ?? 0).toFixed(2)}
          </ThemedText>

          <View style={styles.actionsRow}>
            {isStale && (
              <View style={styles.staleWarning}>
                <ThemedText style={styles.staleText}>
                  Updated tax settings available
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.recalcBtn,
                    Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
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
  entryContainer: {
    borderTopWidth: 1,
    borderTopColor: "#EFEFF4",
    paddingTop: 8,
    marginTop: 8,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  entrySubmittedAt: {
    opacity: 0.8,
  },
  finalTotalText: {
    marginTop: 6,
    color: "#28A745",
    fontWeight: "700",
  },
  entryCollapsedMeta: {
    opacity: 0.8,
  },
  expandIconSmall: {
    opacity: 0.6,
  },
  entryTotalBefore: {
    marginTop: 6,
    fontWeight: "600",
  },
  lineItemRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lineItemLabel: {
    fontWeight: "600",
  },
  lineItemValue: {
    opacity: 0.9,
  },
  lineItemAmount: {
    marginTop: 2,
    alignSelf: "flex-end",
  },
  deductionText: {
    marginTop: 6,
    color: "#FF3B30",
  },
  actionsRow: {
    marginTop: 8,
    alignItems: "flex-end",
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

