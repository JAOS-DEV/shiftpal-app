import { usePeriodFilter } from "@/hooks/usePeriodFilter";
import { useTheme } from "@/providers/ThemeProvider";
import { AppSettings } from "@/types/settings";
import { Day } from "@/types/shift";
import { formatDateDisplay } from "@/utils/timeUtils";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Alert, Platform, TouchableOpacity, View } from "react-native";
import { PeriodFilter } from "../ui/PeriodFilter";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { DayRow } from "./DayRow";
import { styles } from "./HistoryList.styles";

interface HistoryListProps {
  days: Day[];
  onDeleteDay: (date: string) => void;
  onDeleteSubmission?: (date: string, submissionId: string) => void;
  onSubmissionUpdated?: () => void;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  settings: AppSettings | null;
}

export function HistoryList({
  days,
  onDeleteDay,
  onDeleteSubmission,
  onSubmissionUpdated,
  loading = false,
  errorMessage = null,
  onRetry,
  settings,
}: HistoryListProps): React.JSX.Element {
  const { colors } = useTheme();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const {
    currentPeriod,
    currentDateRange,
    handlePeriodChange,
    handleNavigatePrevious,
    handleNavigateNext,
    handleJumpToCurrent,
    isInCurrentPeriod,
  } = usePeriodFilter({ settings });

  // Filter days based on current period - using useMemo like PayHistoryTab
  const filteredDays = useMemo(() => {
    if (currentPeriod === "all") return days;
    return days.filter((day) => isInCurrentPeriod(day.date));
  }, [days, currentPeriod, isInCurrentPeriod]);

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
        History ({filteredDays.length} days)
      </ThemedText>

      <PeriodFilter
        activePeriod={currentPeriod}
        onPeriodChange={handlePeriodChange}
        settings={settings}
        onNavigatePrevious={handleNavigatePrevious}
        onNavigateNext={handleNavigateNext}
        onJumpToCurrent={handleJumpToCurrent}
        currentDateRange={currentDateRange}
      />

      <View style={styles.listContainer}>
        {filteredDays.map((day) => (
          <DayRow
            key={day.id}
            day={day}
            isExpanded={expandedDays.has(day.id)}
            onToggle={() => toggleDayExpansion(day.id)}
            onDelete={() => handleDeleteDay(day.date)}
            onDeleteSubmission={onDeleteSubmission}
            onSubmissionUpdated={onSubmissionUpdated}
          />
        ))}
      </View>
    </ThemedView>
  );
}
