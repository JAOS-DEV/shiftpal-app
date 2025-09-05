import { DailyTotals } from "@/components/DailyTotals";
import { DateSelector } from "@/components/DateSelector";
import { HistoryList } from "@/components/HistoryList";
import { ShiftEntriesList } from "@/components/ShiftEntriesList";
import { ShiftInputSection } from "@/components/ShiftInputSection";
import { SubmitButton } from "@/components/SubmitButton";
import { TabSwitcher } from "@/components/TabSwitcher";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { shiftService } from "@/services/shiftService";
import { Day, HistoryFilter, Shift } from "@/types/shift";
import { formatDateDisplay, getCurrentDateString } from "@/utils/timeUtils";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Tab = "tracker" | "history";

export default function HomeScreen() {
  const { signOutUser } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("tracker");
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [submittedDays, setSubmittedDays] = useState<Day[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>({
    type: "all",
  });

  // Load shifts for selected date
  useEffect(() => {
    loadShiftsForDate(selectedDate);
  }, [selectedDate]);

  // Load submitted days when history tab is active
  useEffect(() => {
    if (activeTab === "history") {
      loadSubmittedDays();
    }
  }, [activeTab, historyFilter]);

  const loadShiftsForDate = async (date: string) => {
    try {
      const shiftsForDate = await shiftService.getShiftsForDate(date);
      setShifts(shiftsForDate);
    } catch (error) {
      console.error("Error loading shifts:", error);
      Alert.alert("Error", "Failed to load shifts for this date");
    }
  };

  const loadSubmittedDays = async () => {
    try {
      const days = await shiftService.getSubmittedDays(historyFilter);
      setSubmittedDays(days);
    } catch (error) {
      console.error("Error loading submitted days:", error);
      Alert.alert("Error", "Failed to load history");
    }
  };

  const handleAddShift = async (startTime: string, endTime: string) => {
    try {
      const newShift = await shiftService.addShift(
        selectedDate,
        startTime,
        endTime
      );
      setShifts((prev) => [...prev, newShift]);
    } catch (error) {
      console.error("Error adding shift:", error);
      Alert.alert("Error", "Failed to add shift");
    }
  };

  const handleRemoveShift = async (shiftId: string) => {
    try {
      await shiftService.removeShift(selectedDate, shiftId);
      setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
    } catch (error) {
      console.error("Error removing shift:", error);
      Alert.alert("Error", "Failed to remove shift");
    }
  };

  const handleSubmitDay = async () => {
    if (shifts.length === 0) return;

    console.log("Submitting day with shifts:", shifts);
    console.log("Selected date:", selectedDate);

    // Check if there are already submitted shifts for this date
    const existingDay = submittedDays.find((day) => day.date === selectedDate);

    if (existingDay) {
      // Show confirmation dialog for existing day
      const message = `You already have ${existingDay.shifts.length} shift${
        existingDay.shifts.length > 1 ? "s" : ""
      } submitted for ${formatDateDisplay(selectedDate)} (${
        existingDay.totalText
      }).\n\nWhat would you like to do?`;

      if (Platform.OS === "web") {
        const choice = confirm(
          `${message}\n\nClick OK to add these shifts to the existing ones, or Cancel to replace them.`
        );
        if (choice) {
          await submitShifts(true); // Add to existing
        } else {
          await submitShifts(false); // Replace existing
        }
      } else {
        Alert.alert("Day Already Has Shifts", message, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add to Existing",
            onPress: () => submitShifts(true), // Add to existing
          },
          {
            text: "Replace All",
            style: "destructive",
            onPress: () => submitShifts(false), // Replace existing
          },
        ]);
      }
    } else {
      // No existing shifts, submit normally
      await submitShifts(false);
    }
  };

  const submitShifts = async (addToExisting: boolean) => {
    setIsSubmitting(true);
    try {
      let submittedDay;

      if (
        addToExisting &&
        submittedDays.find((day) => day.date === selectedDate)
      ) {
        // Merge with existing shifts
        const existingDay = submittedDays.find(
          (day) => day.date === selectedDate
        )!;
        const mergedShifts = [...existingDay.shifts, ...shifts];
        submittedDay = await shiftService.submitDay(selectedDate, mergedShifts);
      } else {
        // Replace or create new
        submittedDay = await shiftService.submitDay(selectedDate, shifts);
      }

      console.log("Successfully submitted day:", submittedDay);

      setShifts([]);

      // Show success message with details
      const totalHours = Math.floor(submittedDay.totalMinutes / 60);
      const totalMins = submittedDay.totalMinutes % 60;
      const timeText =
        totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

      const actionText = addToExisting
        ? "Added to existing shifts"
        : "Submitted";
      const shiftCount = submittedDay.shifts.length;

      Alert.alert(
        "✅ Success!",
        `${actionText} ${shifts.length} shift${
          shifts.length > 1 ? "s" : ""
        } for ${formatDateDisplay(
          selectedDate
        )}\n\nTotal shifts: ${shiftCount}\nTotal time: ${timeText}`,
        [
          {
            text: "View History",
            onPress: () => {
              setActiveTab("history");
              loadSubmittedDays();
            },
          },
          { text: "OK" },
        ]
      );

      // Refresh history if we're on that tab
      if (activeTab === "history") {
        await loadSubmittedDays();
      }
    } catch (error) {
      console.error("Error submitting day:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      Alert.alert(
        "Error",
        `Failed to submit day's shifts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleHistoryFilterChange = (filter: HistoryFilter) => {
    setHistoryFilter(filter);
  };

  const handleDeleteDay = async (date: string) => {
    try {
      await shiftService.deleteDay(date);
      // Reload the submitted days to reflect the deletion
      await loadSubmittedDays();
    } catch (error) {
      console.error("Error deleting day:", error);
      Alert.alert("Error", "Failed to delete day's entry");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }} // Tab bar height + safe area
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "tracker" ? (
            <>
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              <ShiftInputSection onAddShift={handleAddShift} />
              <ShiftEntriesList
                shifts={shifts}
                onRemoveShift={handleRemoveShift}
              />
              <DailyTotals shifts={shifts} />
              <SubmitButton
                shifts={shifts}
                onSubmit={handleSubmitDay}
                isSubmitting={isSubmitting}
              />
            </>
          ) : (
            <HistoryList
              days={submittedDays}
              filter={historyFilter}
              onFilterChange={handleHistoryFilterChange}
              onDeleteDay={handleDeleteDay}
            />
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
