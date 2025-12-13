import { useTheme } from "@/providers/ThemeProvider";
import {
  AppSettings,
  HoursAndMinutes,
  PayCalculationEntry,
} from "@/types/settings";
import { formatTime } from "@/utils/formatUtils";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../ui/ThemedText";
import { PayBreakdownDisplay } from "./PayBreakdownDisplay";

interface PayHistoryEntryProps {
  entry: PayCalculationEntry;
  currencySymbol: string;
  onDelete: (id: string) => void;
  resolveRateValue: (id: string | null | undefined) => number | undefined;
  settings?: AppSettings | null;
}

export const PayHistoryEntry: React.FC<PayHistoryEntryProps> = ({
  entry,
  currencySymbol,
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
      const timeString = d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      return formatTime(timeString, settings);
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
  const taxEnabled = settings?.payRules?.tax?.enabled;
  const niEnabled = settings?.payRules?.ni?.enabled;

  const baseMinutes = hmToMinutes(entry.input.hoursWorked);
  const overtimeMinutes = hmToMinutes(entry.input.overtimeWorked);
  const totalMinutes = baseMinutes + overtimeMinutes;

  // Calculate night hours (handle both new and old formats)
  const getNightHours = (): HoursAndMinutes | undefined => {
    if (!entry.calcSnapshot?.night) return undefined;
    
    // New format: hours field
    if ((entry.calcSnapshot.night as any).hours) {
      return (entry.calcSnapshot.night as any).hours;
    }
    
    // Old format: base + overtime
    const nightBase = (entry.calcSnapshot.night as any).base;
    const nightOt = (entry.calcSnapshot.night as any).overtime;
    if (nightBase || nightOt) {
      const totalNightMinutes =
        hmToMinutes(nightBase) + hmToMinutes(nightOt);
      return {
        hours: Math.floor(totalNightMinutes / 60),
        minutes: totalNightMinutes % 60,
      };
    }
    
    return undefined;
  };

  // Calculate weekend hours (all hours if weekend was enabled)
  const getWeekendHours = (): HoursAndMinutes | undefined => {
    if (!entry.calcSnapshot?.weekend) return undefined;
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    };
  };

  // Calculate night rate
  const getNightRate = (): number | undefined => {
    if (!entry.calcSnapshot?.night) return undefined;
    const nightSettings = entry.calcSnapshot.night as any;
    
    // If mode/multiplier exists (new structure)
    if (nightSettings.mode === "multiplier" && nightSettings.multiplier) {
      return baseRateVal * (nightSettings.multiplier - 1);
    }
    if (nightSettings.mode === "fixed" && nightSettings.uplift) {
      return nightSettings.uplift;
    }
    
    // Legacy: type and value
    if (nightSettings.type === "percentage" && nightSettings.value) {
      return baseRateVal * (nightSettings.value / 100);
    }
    if (nightSettings.type === "fixed" && nightSettings.value) {
      return nightSettings.value;
    }
    
    return undefined;
  };

  // Calculate weekend rate
  const getWeekendRate = (): number | undefined => {
    if (!entry.calcSnapshot?.weekend) return undefined;
    const weekendSettings = entry.calcSnapshot.weekend;
    
    if (weekendSettings.mode === "multiplier" && weekendSettings.value) {
      return baseRateVal * (weekendSettings.value - 1);
    }
    if (weekendSettings.mode === "fixed" && weekendSettings.value) {
      return weekendSettings.value;
    }
    
    return undefined;
  };

  const nightHours = getNightHours();
  const weekendHours = getWeekendHours();
  const nightRate = getNightRate();
  const weekendRate = getWeekendRate();

  return (
    <View
      style={[
        styles.entryCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
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
            <ThemedText
              style={[styles.entryTime, { color: colors.textSecondary }]}
            >
              Submitted at: {formatTimeOfDay(entry.createdAt)}
            </ThemedText>
            <ThemedText
              style={[styles.entryHours, { color: colors.textSecondary }]}
            >
              Hours: {minutesToHMText(totalMinutes)}
            </ThemedText>
          </View>
          <View style={styles.entryTotal}>
            <ThemedText
              style={[styles.entryTotalLabel, { color: colors.textSecondary }]}
            >
              Total
            </ThemedText>
            <ThemedText
              style={[styles.entryTotalValue, { color: colors.primary }]}
            >
              {currencySymbol}
              {entry.calculatedPay.total.toFixed(2)}
            </ThemedText>
          </View>
        </View>
        <ThemedText
          style={[styles.expandIcon, { color: colors.textSecondary }]}
        >
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
            nightHours={nightHours}
            weekendHours={weekendHours}
            baseRate={baseRateVal}
            overtimeRate={overtimeRateVal}
            nightRate={nightRate}
            weekendRate={weekendRate}
            allowanceItems={settings?.payRules?.allowances || []}
            totalHours={totalMinutes / 60}
            showTitle={false}
            taxEnabled={taxEnabled}
            niEnabled={niEnabled}
          />

          <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.actionsBtn,
                { borderColor: colors.border },
                Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
              ]}
              onPress={handleDelete}
            >
              <ThemedText
                style={[styles.actionsBtnText, { color: colors.primary }]}
              >
                Delete
              </ThemedText>
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
    marginBottom: 4,
  },
  entryHours: {
    fontSize: 14,
  },
  entryTotal: {
    alignItems: "flex-end",
    marginLeft: 16,
  },
  entryTotalLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  entryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  expandIcon: {
    fontSize: 16,
    marginLeft: 12,
  },
  actionsRow: {
    marginTop: 16,
    alignItems: "flex-end",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionsBtnText: {
    fontWeight: "600",
  },
});
