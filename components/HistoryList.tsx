import { useTheme } from "@/providers/ThemeProvider";
import { Day, HistoryFilter } from "@/types/shift";
import { formatDateDisplay } from "@/utils/timeUtils";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface HistoryListProps {
  days: Day[];
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onDeleteDay: (date: string) => void;
}

export function HistoryList({
  days,
  filter,
  onFilterChange,
  onDeleteDay,
}: HistoryListProps) {
  const { colors } = useTheme();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDayExpansion = (dayId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  const handleDeleteDay = (date: string) => {
    const day = days.find((d) => d.date === date);
    if (!day) return;

    const message = `Are you sure you want to delete the entry for ${formatDateDisplay(
      date
    )}?\n\nThis will permanently remove ${day.shifts.length} shift${
      day.shifts.length > 1 ? "s" : ""
    } totaling ${day.totalText}.`;

    if (Platform.OS === "web") {
      if (confirm(message)) {
        onDeleteDay(date);
      }
    } else {
      Alert.alert("Delete Day", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteDay(date),
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
          onPress={() => onFilterChange({ type: "week" })}
        >
          <ThemedText style={getFilterTextStyle("week")}>Week</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={getFilterButtonStyle("month")}
          onPress={() => onFilterChange({ type: "month" })}
        >
          <ThemedText style={getFilterTextStyle("month")}>Month</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={getFilterButtonStyle("all")}
          onPress={() => onFilterChange({ type: "all" })}
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
          />
        ))}
      </View>
    </ThemedView>
  );
}

interface DayRowProps {
  day: Day;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function DayRow({ day, isExpanded, onToggle, onDelete }: DayRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.dayRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={onToggle}
        accessibilityLabel={`Toggle details for ${formatDateDisplay(day.date)}`}
      >
        <View style={styles.dayInfo}>
          <ThemedText style={styles.dayDate}>
            {formatDateDisplay(day.date)}
          </ThemedText>
          <ThemedText
            style={[styles.daySubtext, { color: colors.textSecondary }]}
          >
            {day.date}
          </ThemedText>
        </View>

        <View style={styles.dayTotals}>
          <ThemedText style={[styles.dayTotalText, { color: colors.success }]}>
            {day.totalText}
          </ThemedText>
          <ThemedText
            style={[styles.dayTotalMinutes, { color: colors.textSecondary }]}
          >
            ({day.totalMinutes} min)
          </ThemedText>
        </View>

        <View style={styles.dayActions}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            accessibilityLabel={`Delete entry for ${formatDateDisplay(
              day.date
            )}`}
          >
            <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
          </TouchableOpacity>

          <ThemedText
            style={[styles.expandIcon, { color: colors.textSecondary }]}
          >
            {isExpanded ? "▼" : "▶"}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View
          style={[
            styles.shiftsContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          {day.shifts.map((shift, index) => (
            <View
              key={shift.id}
              style={[styles.shiftRow, { borderBottomColor: colors.border }]}
            >
              <ThemedText style={[styles.shiftTime, { color: colors.text }]}>
                {shift.start} - {shift.end}
              </ThemedText>
              <ThemedText
                style={[styles.shiftDuration, { color: colors.textSecondary }]}
              >
                {shift.durationText} ({shift.durationMinutes} min)
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
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
  dayRow: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    // Dynamic colors applied via style prop
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
    // Dynamic colors applied via style prop
  },
  dayTotalMinutes: {
    fontSize: 12,
    opacity: 0.6,
  },
  expandIcon: {
    fontSize: 12,
    opacity: 0.6,
  },
  shiftsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    // Dynamic colors applied via style prop
  },
  shiftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    // Dynamic colors applied via style prop
  },
  shiftTime: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  shiftDuration: {
    fontSize: 12,
    opacity: 0.7,
  },
  dayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "white",
  },
});
