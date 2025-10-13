import { shiftService } from "@/services/shiftService";
import { notify } from "@/utils/notify";
import { calculateDuration, formatDurationText } from "@/utils/timeUtils";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePicker } from "../DatePicker";
import { TimeInput } from "../shift-input/TimeInput";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { IconSymbol } from "../ui/IconSymbol";

interface EditSubmissionModalProps {
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

export const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
  visible,
  submission,
  originalDate,
  onClose,
  onSave,
}) => {
  const [selectedDate, setSelectedDate] = useState(originalDate);
  const [shifts, setShifts] = useState<
    Array<{
      id: string;
      start: string;
      end: string;
      durationMinutes: number;
      durationText: string;
      note?: string;
      createdAt: number;
      breaks?: Array<{
        start: number;
        end: number;
        durationMinutes: number;
        note?: string;
      }>;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedDate(originalDate);
      // Ensure all shifts have createdAt field
      const shiftsWithCreatedAt = submission.shifts.map((shift) => ({
        ...shift,
        createdAt: shift.createdAt ?? Date.now(),
      }));
      setShifts(shiftsWithCreatedAt);
    }
  }, [visible, submission, originalDate]);

  const handleAddShift = (): void => {
    const newShift = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      start: "09:00",
      end: "17:00",
      durationMinutes: 480, // 8 hours
      durationText: "8h 0m",
      note: "",
      createdAt: Date.now(),
    };
    setShifts([...shifts, newShift]);
  };

  const handleRemoveShift = (shiftId: string): void => {
    if (shifts.length <= 1) {
      Alert.alert("Cannot remove shift", "At least one shift is required.");
      return;
    }
    setShifts(shifts.filter((s) => s.id !== shiftId));
  };

  const handleShiftTimeChange = (
    shiftId: string,
    field: "start" | "end",
    value: string
  ): void => {
    setShifts(
      shifts.map((shift) => {
        if (shift.id !== shiftId) return shift;

        const newShift = { ...shift, [field]: value };

        // Recalculate duration when either time changes
        if (field === "start" || field === "end") {
          const duration = calculateDuration(newShift.start, newShift.end);
          newShift.durationMinutes = duration;
          newShift.durationText = formatDurationText(duration);
        }
        return newShift;
      })
    );
  };

  const handleShiftNoteChange = (shiftId: string, note: string): void => {
    setShifts(
      shifts.map((shift) => (shift.id === shiftId ? { ...shift, note } : shift))
    );
  };

  const handleSave = async (): Promise<void> => {
    if (shifts.length === 0) {
      Alert.alert("No shifts", "Please add at least one shift.");
      return;
    }

    // Validate all shifts have valid times
    for (const shift of shifts) {
      if (!shift.start || !shift.end) {
        Alert.alert(
          "Invalid times",
          "All shifts must have start and end times."
        );
        return;
      }
      if (shift.durationMinutes <= 0) {
        Alert.alert(
          "Invalid duration",
          "Shift duration must be greater than 0."
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      // If date changed, we need to move the submission
      if (selectedDate !== originalDate) {
        // Delete from original date
        await shiftService.deleteSubmission(originalDate, submission.id);
        // Create new submission on new date
        await shiftService.submitDay(selectedDate, shifts);
      } else {
        // Update existing submission
        await shiftService.updateSubmission(
          originalDate,
          submission.id,
          shifts
        );
      }

      notify.success("Submission updated", "Your changes have been saved.");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating submission:", error);
      notify.error("Error", "Failed to update submission. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalMinutes = shifts.reduce(
    (sum, shift) => sum + shift.durationMinutes,
    0
  );
  const totalText = formatDurationText(totalMinutes);

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
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>Edit Submission</ThemedText>
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              disabled={isLoading}
            >
              <ThemedText style={styles.saveButtonText}>
                {isLoading ? "Saving..." : "Save"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Date</ThemedText>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText style={styles.dateButtonText}>
                  {selectedDate}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Shifts</ThemedText>
                <TouchableOpacity
                  onPress={handleAddShift}
                  style={styles.addButton}
                >
                  <IconSymbol name="plus" size={16} color="#007AFF" />
                  <ThemedText style={styles.addButtonText}>
                    Add Shift
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {shifts.map((shift, index) => (
                <View key={shift.id} style={styles.shiftCard}>
                  <View style={styles.shiftHeader}>
                    <ThemedText style={styles.shiftNumber}>
                      Shift {index + 1}
                    </ThemedText>
                    {shifts.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveShift(shift.id)}
                        style={styles.removeButton}
                      >
                        <IconSymbol name="trash" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TimeInput
                    startTime={shift.start}
                    endTime={shift.end}
                    onStartTimeChange={(time) =>
                      handleShiftTimeChange(shift.id, "start", time)
                    }
                    onEndTimeChange={(time) =>
                      handleShiftTimeChange(shift.id, "end", time)
                    }
                    showDuration={false}
                    startLabel="Start"
                    endLabel="End"
                    startPlaceholder="09:00"
                    endPlaceholder="17:00"
                    style={styles.timeInputContainer}
                  />

                  <View style={styles.durationDisplay}>
                    <ThemedText style={styles.durationLabel}>
                      Duration
                    </ThemedText>
                    <ThemedText style={styles.durationValue}>
                      {shift.durationText}
                    </ThemedText>
                  </View>

                  <View style={styles.noteInput}>
                    <ThemedText style={styles.noteLabel}>
                      Note (optional)
                    </ThemedText>
                    <TextInput
                      style={styles.noteInputField}
                      value={shift.note || ""}
                      onChangeText={(value) =>
                        handleShiftNoteChange(shift.id, value)
                      }
                      placeholder="Add a note for this shift..."
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.summary}>
              <ThemedText style={styles.summaryTitle}>Total</ThemedText>
              <ThemedText style={styles.summaryValue}>{totalText}</ThemedText>
            </View>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>

      <DatePicker
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  addButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#007AFF",
  },
  shiftCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  shiftHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  shiftNumber: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  removeButton: {
    padding: 4,
  },
  timeInputContainer: {
    marginBottom: 12,
  },
  durationDisplay: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  durationLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#007AFF",
  },
  noteInput: {
    marginTop: 8,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 4,
    color: "#666",
  },
  noteInputField: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    minHeight: 60,
    textAlignVertical: "top" as const,
  },
  summary: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#007AFF",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#000000",
  },
};
