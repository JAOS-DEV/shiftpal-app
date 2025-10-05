import React, { useMemo } from "react";
import {
    Platform, StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { SegmentedSwitcher } from "../SegmentedSwitcher";
import { ThemedText } from "../ThemedText";

type PeriodType = "week" | "month" | "all";

interface PayPeriodFilterProps {
  activePeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  staleCount: number;
  onRecalcAll: () => void;
  onUndo: (() => void) | null;
}

export const PayPeriodFilter: React.FC<PayPeriodFilterProps> = ({
  activePeriod,
  onPeriodChange,
  staleCount,
  onRecalcAll,
  onUndo,
}) => {
  const staleText = useMemo(() => {
    const entryText = staleCount === 1 ? "entry is" : "entries are";
    return `${staleCount} ${entryText} out of date with current settings`;
  }, [staleCount]);

  const handleThisWeek = (): void => {
    onPeriodChange("week");
  };

  return (
    <View style={styles.periodHeader}>
      <SegmentedSwitcher
        items={[
          { id: "week", label: "Week" },
          { id: "month", label: "Month" },
          { id: "all", label: "All" },
        ]}
        activeId={activePeriod}
        onChange={(id) => onPeriodChange(id as PeriodType)}
      />
      <TouchableOpacity
        style={[
          styles.thisWeekBtn,
          Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        ]}
        onPress={handleThisWeek}
      >
        <ThemedText style={styles.thisWeekBtnText}>This Week</ThemedText>
      </TouchableOpacity>
      {staleCount > 0 && (
        <View style={styles.staleWarning}>
          <ThemedText style={styles.staleText}>
            {staleText}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.recalcAllBtn,
              Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
            ]}
            onPress={onRecalcAll}
          >
            <ThemedText style={styles.recalcAllBtnText}>
              Recalculate all in view
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {onUndo && (
        <TouchableOpacity
          style={[
            styles.undoBtn,
            Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
          ]}
          onPress={onUndo}
        >
          <ThemedText style={styles.undoBtnText}>Undo</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  periodHeader: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  thisWeekBtn: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  thisWeekBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  staleWarning: {
    marginTop: 8,
  },
  staleText: {
    color: "#8E8E93",
  },
  recalcAllBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  recalcAllBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  undoBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8E8E93",
  },
  undoBtnText: {
    color: "#8E8E93",
    fontWeight: "600",
  },
});

