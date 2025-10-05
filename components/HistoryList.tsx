import { useTheme } from "@/providers/ThemeProvider";
import { Day, HistoryFilter } from "@/types/shift";
import { formatDateDisplay } from "@/utils/timeUtils";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { DayRow } from "./history/DayRow";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface HistoryListProps {
  days: Day[];
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onDeleteDay: (date: string) => void;
  onDeleteSubmission?: (date: string, submissionId: string) => void;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function HistoryList({
  days,
  filter,
  onFilterChange,
  onDeleteDay,
  onDeleteSubmission,
  loading = false,
  errorMessage = null,
  onRetry,
}: HistoryListProps): React.JSX.Element {
  const { colors } = useTheme();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDayExpansion = (dayId: string): void => {
    try {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {}
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  const handleDeleteDay = (date: string): void => {
    const day = days.find((d) => d.date === date);
    if (!day) return;

    const message = `Are you sure you want to delete the entry for ${formatDateDisplay(
      date
    )}?\n\nThis will permanently remove ${day.submissions.length} submission${
      day.submissions.length === 1 ? "" : "s"
    } totaling ${day.totalText}.`;

    if (Platform.OS === "web") {
      if (confirm(message)) {
        try {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          ).catch(() => {});
        } catch {}
        onDeleteDay(date);
      }
    } else {
      Alert.alert("Delete Day", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              ).catch(() => {});
            } catch {}
            onDeleteDay(date);
          },
        },
      ]);
    }
  };

  const getFilterButtonStyle = (filterType: HistoryFilter["type"]) => [
    styles.filterButton,
    { backgroundColor: colors.card, borderColor: colors.border },
    filter.type === filterType && [
      styles.activeFilterButton,
      { backgroundColor: colors.primary, borderColor: colors.primary },
    ],
  ];

  const getFilterTextStyle = (filterType: HistoryFilter["type"]) => [
    styles.filterButtonText,
    { color: colors.text },
    filter.type === filterType && [
      styles.activeFilterButtonText,
      { color: "white" },
    ],
  ];

  const handleWeekFilter = useCallback(() => {
    onFilterChange({ type: "week" });
  }, [onFilterChange]);

  const handleMonthFilter = useCallback(() => {
    onFilterChange({ type: "month" });
  }, [onFilterChange]);

  const handleAllFilter = useCallback(() => {
    onFilterChange({ type: "all" });
  }, [onFilterChange]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>
          History
        </ThemedText>
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.skeletonRow, { borderColor: colors.border }]}
            >
              <View style={[styles.skeletonBlock, { width: "60%" }]} />
              <View style={[styles.skeletonBlock, { width: 80 }]} />
            </View>
          ))}
        </View>
      </ThemedView>
    );
  }

  if (errorMessage) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>
          History
        </ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Failed to load history
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {String(errorMessage)}
          </ThemedText>
          {onRetry ? (
            <TouchableOpacity
              style={[styles.filterButton, { borderColor: colors.primary }]}
              onPress={onRetry}
            >
              <ThemedText style={[styles.retryText, { color: colors.primary }]}>
                Retry
              </ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
      </ThemedView>
    );
  }

  if (days.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>
          History
        </ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No submitted days yet
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Submit your first day's shifts to see them here
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        History ({days.length} days)
      </ThemedText>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={getFilterButtonStyle("week")}
          onPress={handleWeekFilter}
        >
          <ThemedText style={getFilterTextStyle("week")}>Week</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={getFilterButtonStyle("month")}
          onPress={handleMonthFilter}
        >
          <ThemedText style={getFilterTextStyle("month")}>Month</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={getFilterButtonStyle("all")}
          onPress={handleAllFilter}
        >
          <ThemedText style={getFilterTextStyle("all")}>All Time</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {days.map((day) => (
          <DayRow
            key={day.id}
            day={day}
            isExpanded={expandedDays.has(day.id)}
            onToggle={() => toggleDayExpansion(day.id)}
            onDelete={() => handleDeleteDay(day.date)}
            onDeleteSubmission={onDeleteSubmission}
          />
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
