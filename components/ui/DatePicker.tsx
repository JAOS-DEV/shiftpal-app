import { useTheme } from "@/providers/ThemeProvider";
import { getCurrentDateString, isFutureDate } from "@/utils/timeUtils";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "./DatePicker.styles";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface DatePickerProps {
  visible: boolean;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

export function DatePicker({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
}: DatePickerProps): React.JSX.Element {
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    return new Date(year, month - 1, 1);
  });

  const today = new Date();
  const todayString = getCurrentDateString();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getWeekDays = () => {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date in local timezone to avoid timezone issues
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dateString = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const isFuture = isFutureDate(dateString);
      days.push({
        day,
        date: dateString,
        isToday: dateString === todayString,
        isSelected: dateString === selectedDate,
        isPast: date < today && dateString !== todayString,
        isFuture,
      });
    }

    return days;
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (dateString: string) => {
    onDateSelect(dateString);
    onClose();
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(todayString);
    onClose();
  };

  const calendarDays = generateCalendarDays();
  const weekDays = getWeekDays();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.card }]}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.title}>
              Select Date
            </ThemedText>
            <TouchableOpacity
              onPress={goToToday}
              style={[styles.todayButton, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={styles.todayButtonText}>Today</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              onPress={handlePreviousMonth}
              style={[styles.navButton, { backgroundColor: colors.card }]}
            >
              <ThemedText
                style={[styles.navButtonText, { color: colors.primary }]}
              >
                ‹
              </ThemedText>
            </TouchableOpacity>

            <ThemedText type="defaultSemiBold" style={styles.monthText}>
              {getMonthName(currentMonth)}
            </ThemedText>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={[styles.navButton, { backgroundColor: colors.card }]}
            >
              <ThemedText
                style={[styles.navButtonText, { color: colors.primary }]}
              >
                ›
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <ScrollView style={styles.calendarContainer}>
            {/* Week day headers */}
            <View style={styles.weekHeader}>
              {weekDays.map((day) => (
                <View key={day} style={styles.weekDayHeader}>
                  <ThemedText
                    style={[
                      styles.weekDayText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {day}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Calendar days */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((dayData, index) => {
                if (!dayData) {
                  return <View key={index} style={styles.dayCell} />;
                }

                const { day, date, isToday, isSelected, isPast, isFuture } =
                  dayData;

                return (
                  <TouchableOpacity
                    key={date}
                    onPress={() => handleDateSelect(date)}
                    style={[
                      styles.dayCell,
                      isSelected && [
                        styles.selectedDay,
                        { backgroundColor: colors.primary },
                      ],
                      isToday &&
                        !isSelected && [
                          styles.todayDay,
                          { borderColor: colors.primary },
                        ],
                    ]}
                    disabled={isFuture}
                  >
                    <ThemedText
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && { color: colors.primary },
                        isFuture && {
                          color: colors.textSecondary,
                          opacity: 0.3,
                        },
                      ]}
                    >
                      {day}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}
