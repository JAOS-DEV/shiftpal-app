import { notify } from "@/utils/notify";
import {
  calculateDuration,
  formatDurationText,
  isValidTimeFormat,
  isValidTimeRange,
} from "@/utils/timeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import { Alert, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { styles } from "./ManualModeInput.styles";
import { NoteModal } from "./NoteModal";
import { TimeInput } from "./TimeInput";

interface ManualModeInputProps {
  onAddShift: (startTime: string, endTime: string, note?: string) => void;
}

const STORAGE_KEYS = {
  startTime: "shiftpal.preferences.manual_start_time",
  endTime: "shiftpal.preferences.manual_end_time",
} as const;

export const ManualModeInput: React.FC<ManualModeInputProps> = ({
  onAddShift,
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [prevStartTime, setPrevStartTime] = useState("");
  const [prevEndTime, setPrevEndTime] = useState("");
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");
  const endTimeRef = useRef<TextInput>(null);

  // Load saved times on mount
  useEffect(() => {
    const loadTimes = async (): Promise<void> => {
      try {
        const [savedStart, savedEnd] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.startTime),
          AsyncStorage.getItem(STORAGE_KEYS.endTime),
        ]);
        if (savedStart) {
          setStartTime(savedStart);
          setPrevStartTime(savedStart);
        }
        if (savedEnd) {
          setEndTime(savedEnd);
          setPrevEndTime(savedEnd);
        }
        if (savedStart && savedEnd) {
          validateInputs(savedStart, savedEnd);
        }
      } catch {}
    };
    void loadTimes();
  }, []);

  const validateInputs = (start: string, end: string): boolean => {
    const valid =
      isValidTimeFormat(start) &&
      isValidTimeFormat(end) &&
      isValidTimeRange(start, end);
    setIsValid(valid);
    return valid;
  };

  const formatTimeInput = (text: string, previousValue: string): string => {
    const numbers = text.replace(/\D/g, "");
    const prevNumbers = previousValue.replace(/\D/g, "");

    // If user is deleting characters, don't auto-format
    if (numbers.length < prevNumbers.length) {
      return numbers;
    }

    // If user is trying to delete the colon
    if (
      text.length < previousValue.length &&
      numbers.length === prevNumbers.length
    ) {
      return numbers;
    }

    // Auto-format with colon when we have exactly 2 digits
    if (numbers.length === 2 && numbers.length > prevNumbers.length) {
      return numbers + ":";
    } else if (numbers.length > 2) {
      const hours = numbers.slice(0, 2);
      const minutes = numbers.slice(2, 4);
      return hours + ":" + minutes;
    }

    return numbers;
  };

  const handleStartTimeChange = (text: string): void => {
    const formatted = formatTimeInput(text, prevStartTime);
    setPrevStartTime(formatted);
    setStartTime(formatted);
    validateInputs(formatted, endTime);
    AsyncStorage.setItem(STORAGE_KEYS.startTime, formatted).catch(() => {});

    // Auto-focus end time when start time is valid
    if (isValidTimeFormat(formatted) && endTimeRef.current) {
      endTimeRef.current.focus();
    }
  };

  const handleEndTimeChange = (text: string): void => {
    const formatted = formatTimeInput(text, prevEndTime);
    setPrevEndTime(formatted);
    setEndTime(formatted);
    validateInputs(startTime, formatted);
    AsyncStorage.setItem(STORAGE_KEYS.endTime, formatted).catch(() => {});
  };

  const handleAddShift = (): void => {
    if (!validateInputs(startTime, endTime)) {
      Alert.alert(
        "Invalid Input",
        "Please enter valid start and end times in 24-hour format (HH:MM)"
      );
      return;
    }

    const duration = calculateDuration(startTime, endTime);
    if (duration === 0) {
      Alert.alert("Invalid Duration", "Start and end times cannot be the same");
      return;
    }

    onAddShift(startTime, endTime, noteText.trim() || undefined);

    notify.success("Shift added", `Recorded ${formatDurationText(duration)}`);

    // Reset inputs
    setStartTime("");
    setEndTime("");
    setPrevStartTime("");
    setPrevEndTime("");
    setNoteText("");
    setIsValid(false);
    AsyncStorage.multiRemove([
      STORAGE_KEYS.startTime,
      STORAGE_KEYS.endTime,
    ]).catch(() => {});
  };

  const handleAddNote = (): void => {
    setNoteModalVisible(true);
  };

  const handleSaveNoteAndClose = (): void => {
    setNoteModalVisible(false);
  };

  const handleCancelNote = (): void => {
    setNoteModalVisible(false);
    setNoteText("");
  };

  const getDurationPreview = (): string => {
    if (isValid && startTime && endTime) {
      const duration = calculateDuration(startTime, endTime);
      return formatDurationText(duration);
    }
    return "";
  };

  return (
    <>
      <TimeInput
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={handleStartTimeChange}
        onEndTimeChange={handleEndTimeChange}
        showDuration={true}
        startLabel="Start Time"
        endLabel="End Time"
        startPlaceholder="09:00"
        endPlaceholder="17:00"
        style={styles.timeInputContainer}
      />

      {getDurationPreview() ? (
        <View style={styles.previewContainer}>
          <ThemedText style={styles.previewText}>
            Duration: {getDurationPreview()}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.noteButton, !isValid && styles.disabledButton]}
          onPress={handleAddNote}
          disabled={!isValid}
          accessibilityLabel="Add note"
        >
          <ThemedText
            style={[
              styles.noteButtonText,
              !isValid && styles.disabledButtonText,
            ]}
          >
            Add Note
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, !isValid && styles.disabledButton]}
          onPress={handleAddShift}
          disabled={!isValid}
          accessibilityLabel="Add shift"
        >
          <ThemedText
            style={[
              styles.addButtonText,
              !isValid && styles.disabledButtonText,
            ]}
          >
            Add Shift
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.helpContainer}>
        <ThemedText style={styles.helpText}>
          Enter the start and end times of your shift in 24-hour format (HH:MM).
          Overnight shifts are supported.
        </ThemedText>
      </View>

      <NoteModal
        visible={noteModalVisible}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onSave={handleSaveNoteAndClose}
        onCancel={handleCancelNote}
      />
    </>
  );
};
