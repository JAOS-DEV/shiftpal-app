import { DailyTotals } from "@/components/DailyTotals";
import { DateSelector } from "@/components/DateSelector";
import { HistoryList } from "@/components/HistoryList";
import { SegmentedSwitcher } from "@/components/SegmentedSwitcher";
import { ShiftEntriesList } from "@/components/ShiftEntriesList";
import { ShiftInputSection } from "@/components/ShiftInputSection";
import { SubmitButton } from "@/components/SubmitButton";
import { ThemedView } from "@/components/ThemedView";
import { logAnalyticsEvent } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { shiftService } from "@/services/shiftService";
import { AppSettings } from "@/types/settings";
import { Day, Shift } from "@/types/shift";
import { notify } from "@/utils/notify";
import { formatDateDisplay, getCurrentDateString } from "@/utils/timeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Tab = "tracker" | "history";

export default function HomeScreen() {
  const { signOutUser } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<Tab>("tracker");
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [submittedDays, setSubmittedDays] = useState<Day[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Load settings when focused
  useEffect(() => {
    const loadSettings = async () => {
      if (!isFocused) return;
      try {
        const s = await settingsService.getSettings();
        setSettings(s);
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();

    // Subscribe to live settings changes
    const unsub = settingsService.subscribe((next) => {
      setSettings(next);
    });

    return () => unsub();
  }, [isFocused]);

  // Load shifts for selected date
  useEffect(() => {
    loadShiftsForDate(selectedDate);
  }, [selectedDate]);

  // Load last selected tab once on mount
  useEffect(() => {
    const loadTab = async () => {
      try {
        const saved = await AsyncStorage.getItem("shiftpal.ui.active_tab");
        if (saved === "tracker" || saved === "history") {
          setActiveTab(saved);
        }
      } catch {}
    };
    loadTab();
  }, []);

  // Load submitted days when history tab is active
  useEffect(() => {
    if (activeTab === "history") {
      loadSubmittedDays();
    }
  }, [activeTab]);

  // Poll timer state to show tiny indicator on tab (future) or other UX
  useEffect(() => {
    let id: any;
    const tick = async () => {
      try {
        const t = await shiftService.getRunningTimer();
        setTimerRunning(Boolean(t));
      } catch {}
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
      // Load all days - filtering will be handled locally in HistoryList
      const days = await shiftService.getSubmittedDays(
        { type: "all" },
        settings
      );
      setSubmittedDays(days);
    } catch (error) {
      console.error("Error loading submitted days:", error);
      Alert.alert("Error", "Failed to load history");
    }
  };

  const handleAddShift = async (
    startTime: string,
    endTime: string,
    note?: string
  ) => {
    try {
      const newShift = await shiftService.addShift(
        selectedDate,
        startTime,
        endTime,
        note
      );
      setShifts((prev) => [...prev, newShift]);
      await logAnalyticsEvent("add_shift", {
        date: selectedDate,
        duration_minutes: newShift.durationMinutes,
      });
    } catch (error) {
      console.error("Error adding shift:", error);
      Alert.alert("Error", "Failed to add shift");
    }
  };

  const handleRemoveShift = async (shiftId: string) => {
    try {
      await shiftService.removeShift(selectedDate, shiftId);
      setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
      await logAnalyticsEvent("remove_shift", {
        date: selectedDate,
        shift_id: shiftId,
      });
    } catch (error) {
      console.error("Error removing shift:", error);
      Alert.alert("Error", "Failed to remove shift");
    }
  };

  const handleSubmitDay = async () => {
    if (shifts.length === 0) return;
    await submitShifts();
  };

  const submitShifts = async () => {
    setIsSubmitting(true);
    try {
      const submittedDay = await shiftService.submitDay(selectedDate, shifts);

      console.log("Successfully submitted day:", submittedDay);

      setShifts([]);

      // Show success message with details
      const totalHours = Math.floor(submittedDay.totalMinutes / 60);
      const totalMins = submittedDay.totalMinutes % 60;
      const timeText =
        totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

      const hadExisting = Boolean(
        submittedDays.find((d) => d.date === selectedDate)
      );
      const actionText = hadExisting
        ? "Added as a new submission"
        : "Submitted";
      // Analytics: submission
      try {
        await logAnalyticsEvent("submit_day", {
          date: selectedDate,
          shift_count: shifts.length,
          had_existing: hadExisting,
          action: hadExisting ? "append" : "create",
        });
      } catch {}

      notify.success(
        "Day submitted",
        `${actionText} • ${shifts.length} shift${
          shifts.length > 1 ? "s" : ""
        } • ${formatDateDisplay(selectedDate)} • Total ${timeText}`
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
    try {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {}
    setActiveTab(tab);
    AsyncStorage.setItem("shiftpal.ui.active_tab", tab).catch(() => {});
  };

  const handleDeleteDay = async (date: string) => {
    try {
      await shiftService.deleteDay(date);
      // Reload the submitted days to reflect the deletion
      await loadSubmittedDays();
      await logAnalyticsEvent("delete_day", { date });
    } catch (error) {
      console.error("Error deleting day:", error);
      Alert.alert("Error", "Failed to delete day's entry");
    }
  };

  const handleDeleteSubmission = async (date: string, submissionId: string) => {
    try {
      await shiftService.deleteSubmission(date, submissionId);
      await loadSubmittedDays();
    } catch (error) {
      console.error("Error deleting submission:", error);
      Alert.alert("Error", "Failed to delete submission");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={Platform.OS === "web" ? styles.webMaxWidth : undefined}>
          <SegmentedSwitcher
            items={[
              { id: "tracker", label: "Tracker", showDot: timerRunning },
              { id: "history", label: "History" },
            ]}
            activeId={activeTab}
            onChange={(id) => handleTabChange(id as Tab)}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60, // Tab bar height + safe area
            ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={Platform.OS === "web" ? styles.webMaxWidth : undefined}>
            {activeTab === "tracker" ? (
              <>
                <DateSelector
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
                {/* Timer banner removed; status shown inline in Shift input header. */}
                <ShiftInputSection
                  onAddShift={handleAddShift}
                  onShiftListRefresh={() => loadShiftsForDate(selectedDate)}
                  selectedDate={selectedDate}
                />
                <ShiftEntriesList
                  shifts={shifts}
                  onRemoveShift={handleRemoveShift}
                  embedded
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
                onDeleteDay={handleDeleteDay}
                onDeleteSubmission={handleDeleteSubmission}
                settings={settings}
              />
            )}
          </View>
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
  webMaxWidth: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  timerBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FFF9E6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bannerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
