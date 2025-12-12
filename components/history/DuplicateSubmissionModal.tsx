import { useTheme } from "@/providers/ThemeProvider";
import { shiftService } from "@/services/shiftService";
import { notify } from "@/utils/notify";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePicker } from "../ui/DatePicker";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { IconSymbol } from "../ui/IconSymbol";

interface DuplicateSubmissionModalProps {
  visible: boolean;
  submission: {
    id: string;
    shifts: Array<{
      id: string;
      start: string;
      end: string;
      durationMinutes: number;
      durationText: string;
      note?: string;
      createdAt?: number;
      breaks?: Array<{
        start: number;
        end: number;
        durationMinutes: number;
        note?: string;
      }>;
    }>;
    totalMinutes: number;
    totalText: string;
    submittedAt: number;
  };
  originalDate: string;
  onClose: () => void;
  onSave: () => void;
}

export const DuplicateSubmissionModal: React.FC<
  DuplicateSubmissionModalProps
> = ({ visible, submission, originalDate, onClose, onSave }) => {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async (): Promise<void> => {
    if (!selectedDate) {
      Alert.alert(
        "No date selected",
        "Please select a date for the duplicate."
      );
      return;
    }

    if (selectedDate === originalDate) {
      Alert.alert(
        "Same date",
        "Please select a different date for the duplicate."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Clone the shifts with new IDs and timestamps
      const clonedShifts = submission.shifts.map((shift) => ({
        ...shift,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        createdAt: Date.now(),
      }));

      // Use the existing submitDay method to create the duplicate
      await shiftService.submitDay(selectedDate, clonedShifts);

      notify.success(
        "Submission duplicated",
        `Shifts copied to ${selectedDate}`
      );
      onSave();
      onClose();
    } catch (error) {
      console.error("Error duplicating submission:", error);
      notify.error(
        "Error",
        "Failed to duplicate submission. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return "Select date";
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ThemedView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText
                style={[styles.closeButtonText, { color: colors.primary }]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Duplicate Submission
            </ThemedText>
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isLoading && [
                  styles.saveButtonDisabled,
                  { backgroundColor: colors.border },
                ],
              ]}
              disabled={isLoading || !selectedDate}
            >
              <ThemedText style={styles.saveButtonText}>
                {isLoading ? "Duplicating..." : "Duplicate"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Original Date
              </ThemedText>
              <ThemedText
                style={[
                  styles.originalDateText,
                  { color: colors.textSecondary },
                ]}
              >
                {formatDateForDisplay(originalDate)}
              </ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Duplicate To Date
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText
                  style={[styles.dateButtonText, { color: colors.text }]}
                >
                  {formatDateForDisplay(selectedDate)}
                </ThemedText>
                <IconSymbol
                  name="calendar"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Shifts to Duplicate
              </ThemedText>
              <View style={styles.shiftsList}>
                {submission.shifts.map((shift, index) => (
                  <View
                    key={shift.id}
                    style={[
                      styles.shiftItem,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.shiftNumber,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Shift {index + 1}
                    </ThemedText>
                    <ThemedText
                      style={[styles.shiftTimes, { color: colors.text }]}
                    >
                      {shift.start} - {shift.end}
                    </ThemedText>
                    <ThemedText
                      style={[styles.shiftDuration, { color: colors.primary }]}
                    >
                      {shift.durationText}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.summary, { borderTopColor: colors.border }]}>
              <ThemedText style={[styles.summaryTitle, { color: colors.text }]}>
                Total
              </ThemedText>
              <ThemedText
                style={[styles.summaryValue, { color: colors.primary }]}
              >
                {submission.totalText}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>

      <DatePicker
        visible={showDatePicker}
        selectedDate={selectedDate || originalDate}
        onDateSelect={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Will be overridden by theme
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA", // Will be overridden by theme
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007AFF", // Will be overridden by theme
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  saveButton: {
    backgroundColor: "#007AFF", // Will be overridden by theme
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#C7C7CC", // Will be overridden by theme
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  originalDateText: {
    fontSize: 16,
    color: "#666", // Will be overridden by theme
    paddingVertical: 8,
  },
  dateButton: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: "#D1D5DB", // Will be overridden by theme
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF", // Will be overridden by theme
  },
  dateButtonText: {
    fontSize: 16,
    color: "#000000", // Will be overridden by theme
  },
  shiftsList: {
    gap: 8,
  },
  shiftItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: "#F8F9FA", // Will be overridden by theme
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shiftNumber: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#666", // Will be overridden by theme
  },
  shiftTimes: {
    fontSize: 14,
    color: "#000000", // Will be overridden by theme
  },
  shiftDuration: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#007AFF", // Will be overridden by theme
  },
  summary: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA", // Will be overridden by theme
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#007AFF", // Will be overridden by theme
  },
};
