import { notify } from "@/utils/notify";
import {
    calculateDuration,
    formatDurationText,
    isValidTimeFormat,
    isValidTimeRange,
} from "@/utils/timeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

interface ManualModeInputProps {
  onAddShift: (startTime: string, endTime: string) => void;
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

    onAddShift(startTime, endTime);

    notify.success("Shift added", `Recorded ${formatDurationText(duration)}`);

    // Reset inputs
    setStartTime("");
    setEndTime("");
    setPrevStartTime("");
    setPrevEndTime("");
    setIsValid(false);
    AsyncStorage.multiRemove([
      STORAGE_KEYS.startTime,
      STORAGE_KEYS.endTime,
    ]).catch(() => {});
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
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Start Time</ThemedText>
          <TextInput
            style={[
              styles.timeInput,
              isValidTimeFormat(startTime) && styles.validInput,
              !startTime || isValidTimeFormat(startTime)
                ? styles.defaultInput
                : styles.invalidInput,
            ]}
            value={startTime}
            onChangeText={handleStartTimeChange}
            placeholder="09:00"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="next"
            onSubmitEditing={() => endTimeRef.current?.focus()}
            accessibilityLabel="Start time input"
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>End Time</ThemedText>
          <TextInput
            ref={endTimeRef}
            style={[
              styles.timeInput,
              isValidTimeFormat(endTime) && styles.validInput,
              !endTime || isValidTimeFormat(endTime)
                ? styles.defaultInput
                : styles.invalidInput,
            ]}
            value={endTime}
            onChangeText={handleEndTimeChange}
            placeholder="17:00"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="done"
            onSubmitEditing={handleAddShift}
            accessibilityLabel="End time input"
          />
        </View>
      </View>

      {getDurationPreview() ? (
        <View style={styles.previewContainer}>
          <ThemedText style={styles.previewText}>
            Duration: {getDurationPreview()}
          </ThemedText>
        </View>
      ) : null}

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

      <View style={styles.helpContainer}>
        <ThemedText style={styles.helpText}>
          Enter the start and end times of your shift in 24-hour format (HH:MM).
          Overnight shifts are supported.
        </ThemedText>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    opacity: 0.8,
  },
  timeInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  defaultInput: {
    borderColor: "#E5E5EA",
    backgroundColor: "#F8F8F8",
  },
  validInput: {
    borderColor: "#34C759",
    backgroundColor: "#F0F9F4",
  },
  invalidInput: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
  },
  previewContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  previewText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  addButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#E5E5EA",
    opacity: 0.5,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButtonText: {
    color: "#999",
  },
  helpContainer: {
    marginTop: 12,
  },
  helpText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.6,
  },
});

