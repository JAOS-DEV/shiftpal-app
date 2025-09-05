import { shiftService } from "@/services/shiftService";
import {
  calculateDuration,
  formatDurationText,
  getCurrentDateString,
  isValidTimeFormat,
  isValidTimeRange,
} from "@/utils/timeUtils";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface ShiftInputSectionProps {
  onAddShift: (startTime: string, endTime: string) => void;
}

export function ShiftInputSection({ onAddShift }: ShiftInputSectionProps) {
  const [mode, setMode] = useState<"manual" | "timer">("manual");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isValid, setIsValid] = useState(false);
  const endTimeRef = useRef<TextInput>(null);
  const [prevStartTime, setPrevStartTime] = useState("");
  const [prevEndTime, setPrevEndTime] = useState("");
  const [timerState, setTimerState] = useState<{
    running: boolean;
    paused: boolean;
    startedAt?: number;
    elapsedMs: number;
  }>({ running: false, paused: false, elapsedMs: 0 });
  const [timerInterval, setTimerInterval] = useState<any>(null);

  const validateInputs = (start: string, end: string) => {
    const valid =
      isValidTimeFormat(start) &&
      isValidTimeFormat(end) &&
      isValidTimeRange(start, end);
    setIsValid(valid);
    return valid;
  };

  const formatTimeInput = (text: string, previousValue: string) => {
    // Remove any non-numeric characters
    const numbers = text.replace(/\D/g, "");
    const prevNumbers = previousValue.replace(/\D/g, "");

    // If user is deleting characters, don't auto-format
    if (numbers.length < prevNumbers.length) {
      return numbers;
    }

    // If user is trying to delete the colon (text is shorter but numbers are same)
    if (
      text.length < previousValue.length &&
      numbers.length === prevNumbers.length
    ) {
      return numbers;
    }

    // Auto-format with colon only when we have exactly 2 digits and user is adding
    if (numbers.length === 2 && numbers.length > prevNumbers.length) {
      return numbers + ":";
    } else if (numbers.length > 2) {
      const hours = numbers.slice(0, 2);
      const minutes = numbers.slice(2, 4);
      return hours + ":" + minutes;
    }

    return numbers;
  };

  const handleStartTimeChange = (text: string) => {
    const formatted = formatTimeInput(text, prevStartTime);
    setPrevStartTime(formatted);
    setStartTime(formatted);
    validateInputs(formatted, endTime);

    // Auto-focus end time when start time is valid
    if (isValidTimeFormat(formatted) && endTimeRef.current) {
      endTimeRef.current.focus();
    }
  };

  const handleEndTimeChange = (text: string) => {
    const formatted = formatTimeInput(text, prevEndTime);
    setPrevEndTime(formatted);
    setEndTime(formatted);
    validateInputs(startTime, formatted);
  };

  const handleAddShift = () => {
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

    // Reset inputs
    setStartTime("");
    setEndTime("");
    setPrevStartTime("");
    setPrevEndTime("");
    setIsValid(false);
  };

  const getDurationPreview = () => {
    if (isValid && startTime && endTime) {
      const duration = calculateDuration(startTime, endTime);
      return formatDurationText(duration);
    }
    return "";
  };

  // Timer helpers
  const refreshTimer = async () => {
    const t = await shiftService.getRunningTimer();
    if (!t) {
      setTimerState({ running: false, paused: false, elapsedMs: 0 });
      return;
    }
    const now = Date.now();
    let pausedMs = 0;
    for (const p of t.pauses) {
      const end = p.end ?? (t.status === "paused" ? now : p.start);
      if (end && p.start) pausedMs += Math.max(0, end - p.start);
    }
    const elapsedMs = Math.max(0, now - t.startedAt - pausedMs);
    setTimerState({
      running: true,
      paused: t.status === "paused",
      startedAt: t.startedAt,
      elapsedMs,
    });
  };

  useEffect(() => {
    if (mode !== "timer") {
      if (timerInterval) clearInterval(timerInterval);
      return;
    }
    refreshTimer();
    if (timerInterval) clearInterval(timerInterval);
    const id = setInterval(() => {
      refreshTimer();
    }, 1000);
    setTimerInterval(id);
    return () => clearInterval(id);
  }, [mode]);

  const handleTimerStart = async () => {
    await shiftService.startTimer(getCurrentDateString());
    await refreshTimer();
  };
  const handleTimerPauseResume = async () => {
    if (timerState.paused) {
      await shiftService.resumeTimer();
    } else {
      await shiftService.pauseTimer();
    }
    await refreshTimer();
  };
  const handleTimerStop = async () => {
    const shift = await shiftService.stopTimer();
    await refreshTimer();
    if (shift) {
      onAddShift(shift.start, shift.end);
      Alert.alert("Shift Added", `Recorded ${shift.durationText}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Add New Shift
      </ThemedText>

      <View style={styles.headerRow}>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "manual" && styles.modeButtonActive,
            ]}
            onPress={() => setMode("manual")}
          >
            <ThemedText
              style={[
                styles.modeText,
                mode === "manual" && styles.modeTextActive,
              ]}
            >
              Manual
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "timer" && styles.modeButtonActive,
            ]}
            onPress={() => setMode("timer")}
          >
            <ThemedText
              style={[
                styles.modeText,
                mode === "timer" && styles.modeTextActive,
              ]}
            >
              Timer
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Timer chip removed per UX */}
      </View>

      {mode === "manual" ? (
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
      ) : (
        <View style={styles.timerContainer}>
          <ThemedText style={styles.timerElapsed}>
            {new Date(timerState.elapsedMs).toISOString().substr(11, 8)}
          </ThemedText>

          {!timerState.running ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTimerStart}
            >
              <ThemedText style={styles.primaryButtonText}>Start</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerButtonsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleTimerPauseResume}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  {timerState.paused ? "Resume" : "Pause"}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleTimerStop}
              >
                <ThemedText style={styles.dangerButtonText}>Stop</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {mode === "manual" && getDurationPreview() ? (
        <View style={styles.previewContainer}>
          <ThemedText style={styles.previewText}>
            Duration: {getDurationPreview()}
          </ThemedText>
        </View>
      ) : null}

      {mode === "manual" && (
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
      )}

      {mode === "manual" && (
        <View style={styles.helpContainer}>
          <ThemedText style={styles.helpText}>
            Type numbers and the colon will be added automatically. Overnight
            shifts are supported.
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#F8F8F8",
  },
  modeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  modeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  modeTextActive: {
    color: "#fff",
  },
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
    fontWeight: "500",
    color: "#34C759",
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
    alignItems: "center",
  },
  helpText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timerChipButtons: {
    flexDirection: "row",
    gap: 6,
  },
  timerChipBtn: {
    backgroundColor: "#F0F0F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timerChipBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timerChipDanger: {
    backgroundColor: "#FFEBEB",
  },
  timerChipDangerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D00",
  },
  timerContainer: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  timerElapsed: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
    lineHeight: 40,
  },
  timerButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F0F0F5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
