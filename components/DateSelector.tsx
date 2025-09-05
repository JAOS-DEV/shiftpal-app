import { useTheme } from "@/providers/ThemeProvider";
import { formatDateDisplay, getCurrentDateString } from "@/utils/timeUtils";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { DatePicker } from "./DatePicker";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePreviousDay = () => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(getCurrentDateString());
  };

  const isToday = selectedDate === getCurrentDateString();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Select Date
        </ThemedText>
        {!isToday && (
          <TouchableOpacity
            onPress={handleToday}
            style={[styles.todayButton, { backgroundColor: colors.primary }]}
          >
            <ThemedText style={styles.todayButtonText}>Today</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dateControls}>
        <TouchableOpacity
          onPress={handlePreviousDay}
          style={[
            styles.navButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          accessibilityLabel="Previous day"
        >
          <ThemedText style={[styles.navButtonText, { color: colors.primary }]}>
            ‹
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDatePicker(!showDatePicker)}
          style={[
            styles.dateButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          accessibilityLabel="Select date"
        >
          <ThemedText type="defaultSemiBold" style={styles.dateText}>
            {formatDateDisplay(selectedDate)}
          </ThemedText>
          <ThemedText
            style={[styles.dateSubtext, { color: colors.textSecondary }]}
          >
            {selectedDate}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNextDay}
          style={[
            styles.navButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          accessibilityLabel="Next day"
        >
          <ThemedText style={[styles.navButtonText, { color: colors.primary }]}>
            ›
          </ThemedText>
        </TouchableOpacity>
      </View>

      <DatePicker
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateSelect={onDateChange}
        onClose={() => setShowDatePicker(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  dateControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: "300",
  },
  dateButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 6,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    marginBottom: 1,
  },
  dateSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
});
