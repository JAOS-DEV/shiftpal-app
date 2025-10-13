import { useTheme } from "@/providers/ThemeProvider";
import {
  calculateDuration,
  formatDurationText,
  isValidTimeFormat,
  isValidTimeRange,
} from "@/utils/timeUtils";
import React, { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface TimeInputProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  showDuration?: boolean;
  startLabel?: string;
  endLabel?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  style?: any;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  showDuration = true,
  startLabel = "Start Time",
  endLabel = "End Time",
  startPlaceholder = "09:00",
  endPlaceholder = "17:00",
  style,
}) => {
  const { colors } = useTheme();
  const [prevStartTime, setPrevStartTime] = useState(startTime);
  const [prevEndTime, setPrevEndTime] = useState(endTime);
  const endTimeRef = useRef<TextInput>(null);

  const validateInputs = (start: string, end: string): boolean => {
    return (
      isValidTimeFormat(start) &&
      isValidTimeFormat(end) &&
      isValidTimeRange(start, end)
    );
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
    onStartTimeChange(formatted);

    // Auto-focus end time when start time is valid
    if (isValidTimeFormat(formatted) && endTimeRef.current) {
      endTimeRef.current.focus();
    }
  };

  const handleEndTimeChange = (text: string): void => {
    const formatted = formatTimeInput(text, prevEndTime);
    setPrevEndTime(formatted);
    onEndTimeChange(formatted);
  };

  const getDurationPreview = (): string => {
    if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
      const duration = calculateDuration(startTime, endTime);
      return formatDurationText(duration);
    }
    return "";
  };

  const isValid = validateInputs(startTime, endTime);

  return (
    <View style={style}>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>{startLabel}</ThemedText>
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
            placeholder={startPlaceholder}
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="next"
            onSubmitEditing={() => endTimeRef.current?.focus()}
            accessibilityLabel="Start time input"
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>{endLabel}</ThemedText>
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
            placeholder={endPlaceholder}
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="done"
            accessibilityLabel="End time input"
          />
        </View>
      </View>

      {showDuration && getDurationPreview() ? (
        <View style={styles.previewContainer}>
          <ThemedText style={styles.previewText}>
            Duration: {getDurationPreview()}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
};

const styles = {
  inputRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 6,
    color: "#374151",
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: "center" as const,
  },
  defaultInput: {
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  validInput: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  invalidInput: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  previewContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  previewText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center" as const,
  },
};
