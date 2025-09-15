import { shiftService } from "@/services/shiftService";
import { notify } from "@/utils/notify";
import {
  calculateDuration,
  formatDurationText,
  getCurrentDateString,
  isValidTimeFormat,
  isValidTimeRange,
} from "@/utils/timeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface ShiftInputSectionProps {
  onAddShift: (startTime: string, endTime: string) => void;
  onShiftListRefresh?: () => void;
}

export function ShiftInputSection({
  onAddShift,
  onShiftListRefresh,
}: ShiftInputSectionProps) {
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
    currentBreakMs?: number;
    breaks?: Array<{ start: number; end?: number; durationMs: number }>;
    totalBreakMs?: number;
  }>({ running: false, paused: false, elapsedMs: 0 });
  const [timerInterval, setTimerInterval] = useState<any>(null);
  const [includeBreaks, setIncludeBreaks] = useState(false);
  const [showBreakHistory, setShowBreakHistory] = useState(true);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Keys for persisted preferences
  const STORAGE_KEYS = {
    mode: "shiftpal.preferences.input_mode",
    includeBreaks: "shiftpal.preferences.include_breaks",
    startTime: "shiftpal.preferences.manual_start_time",
    endTime: "shiftpal.preferences.manual_end_time",
  } as const;

  // Load persisted preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedMode, savedIncludeBreaks, savedStart, savedEnd] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.mode),
            AsyncStorage.getItem(STORAGE_KEYS.includeBreaks),
            AsyncStorage.getItem(STORAGE_KEYS.startTime),
            AsyncStorage.getItem(STORAGE_KEYS.endTime),
          ]);
        if (savedMode === "manual" || savedMode === "timer") {
          setMode(savedMode);
        }
        if (savedIncludeBreaks === "true" || savedIncludeBreaks === "false") {
          setIncludeBreaks(savedIncludeBreaks === "true");
        }
        if (savedStart) setStartTime(savedStart);
        if (savedEnd) setEndTime(savedEnd);
      } catch {}
    };
    loadPreferences();
  }, []);

  // Persist mode changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.mode, mode).catch(() => {});
  }, [mode]);

  // Persist includeBreaks changes
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.includeBreaks,
      includeBreaks ? "true" : "false"
    ).catch(() => {});
  }, [includeBreaks]);

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
    AsyncStorage.setItem(STORAGE_KEYS.startTime, formatted).catch(() => {});

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
    AsyncStorage.setItem(STORAGE_KEYS.endTime, formatted).catch(() => {});
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
    // If currently paused, compute current open break elapsed
    let currentBreakMs: number | undefined = undefined;
    const lastPause = t.pauses[t.pauses.length - 1];
    if (t.status === "paused" && lastPause && !lastPause.end) {
      currentBreakMs = Math.max(0, now - lastPause.start);
    }

    // Compute break intervals with durations and total
    const pad = (n: number) => String(n).padStart(2, "0");
    const breaks = t.pauses.map((p) => {
      const effectiveEnd = p.end ?? (t.status === "paused" ? now : undefined);
      const durationMs = Math.max(0, (effectiveEnd ?? now) - p.start);
      return { start: p.start, end: p.end, durationMs };
    });
    const totalBreakMs = breaks.reduce((sum, b) => sum + b.durationMs, 0);
    setTimerState({
      running: true,
      paused: t.status === "paused",
      startedAt: t.startedAt,
      elapsedMs,
      currentBreakMs,
      breaks,
      totalBreakMs,
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await shiftService.startTimer(getCurrentDateString());
    await refreshTimer();
  };
  const handleTimerPauseResume = async () => {
    if (timerState.paused) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await shiftService.resumeTimer();
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await shiftService.pauseTimer();
    }
    await refreshTimer();
  };
  const handleTimerStop = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const shift = await shiftService.stopTimer(includeBreaks);
    await refreshTimer();
    if (!shift) return;
    // stopTimer already persisted the shift to storage; ask parent to refresh
    onShiftListRefresh?.();
    const suffix = shift.breakMinutes
      ? includeBreaks
        ? ` (breaks ${shift.breakMinutes}m included)`
        : ` (breaks ${shift.breakMinutes}m excluded)`
      : "";
    notify.success("Shift added", `Recorded ${shift.durationText}${suffix}`);
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

          {timerState.paused &&
          typeof timerState.currentBreakMs === "number" ? (
            <View style={styles.breakTimerContainer}>
              <ThemedText style={styles.breakTimerLabel}>Break time</ThemedText>
              <ThemedText style={styles.breakTimerValue}>
                {new Date(timerState.currentBreakMs)
                  .toISOString()
                  .substr(11, 8)}
              </ThemedText>
            </View>
          ) : null}

          {Array.isArray(timerState.breaks) && timerState.breaks.length > 0 ? (
            <View style={styles.breakHistoryContainer}>
              <TouchableOpacity
                onPress={() => setShowBreakHistory((s) => !s)}
                accessibilityLabel="Toggle break history"
                style={styles.breakHeaderRow}
              >
                <ThemedText style={styles.breakHistoryTitle}>
                  Break history
                </ThemedText>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color="#666"
                  style={{
                    transform: [
                      { rotate: showBreakHistory ? "90deg" : "0deg" },
                    ],
                  }}
                />
              </TouchableOpacity>
              {showBreakHistory ? (
                <>
                  {timerState.breaks.map(
                    (
                      b: {
                        start: number;
                        end?: number;
                        durationMs: number;
                        note?: string;
                      },
                      idx: number
                    ) => (
                      <View key={b.start} style={styles.breakRow}>
                        <ThemedText style={styles.breakIndex}>
                          #{idx + 1}
                        </ThemedText>
                        <ThemedText style={styles.breakDuration}>
                          {new Date(b.durationMs).toISOString().substr(11, 8)}
                        </ThemedText>
                        <ThemedText style={styles.breakTimes}>
                          {new Date(b.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {b.end
                            ? new Date(b.end).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "now"}
                        </ThemedText>
                        {b.note ? (
                          <ThemedText style={styles.breakNote}>
                            {b.note}
                          </ThemedText>
                        ) : null}
                      </View>
                    )
                  )}
                  {typeof timerState.totalBreakMs === "number" ? (
                    <View style={styles.breakTotalRow}>
                      <ThemedText style={styles.breakTotalLabel}>
                        Total breaks
                      </ThemedText>
                      <ThemedText style={styles.breakTotalValue}>
                        {new Date(timerState.totalBreakMs)
                          .toISOString()
                          .substr(11, 8)}
                      </ThemedText>
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : null}

          <View style={styles.breakToggleRow}>
            <ThemedText style={styles.breakToggleLabel}>
              Include breaks in total
            </ThemedText>
            <Switch value={includeBreaks} onValueChange={setIncludeBreaks} />
          </View>

          {!timerState.running ? (
            <TouchableOpacity
              style={[styles.primaryButton, { width: "100%" }]}
              onPress={handleTimerStart}
            >
              <ThemedText style={styles.primaryButtonText}>Start</ThemedText>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.primaryActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.actionFlex]}
                  onPress={handleTimerPauseResume}
                  accessibilityLabel={
                    timerState.paused ? "Resume shift" : "Start break"
                  }
                >
                  <ThemedText style={styles.secondaryButtonText}>
                    {timerState.paused ? "End break" : "Start break"}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerButton, styles.actionFlex]}
                  onPress={handleTimerStop}
                >
                  <ThemedText style={styles.dangerButtonText}>Stop</ThemedText>
                </TouchableOpacity>
              </View>

              {timerState.paused ? (
                <View style={styles.secondaryActionsRow}>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.actionFlex]}
                    onPress={() => setNoteModalVisible(true)}
                    accessibilityLabel="Add note to current break"
                  >
                    <ThemedText style={styles.noteButtonText}>
                      Add note
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.undoButton, styles.actionFlex]}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      await shiftService.undoLastBreak();
                      await refreshTimer();
                    }}
                    accessibilityLabel="Undo last break"
                  >
                    <ThemedText style={styles.undoButtonText}>
                      Undo break
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}
        </View>
      )}

      {/* Note modal */}
      {noteModalVisible ? (
        <View style={styles.noteModalOverlay}>
          <View style={styles.noteModal}>
            <ThemedText style={styles.noteModalTitle}>
              Add break note
            </ThemedText>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="e.g., Lunch, Personal errand"
              placeholderTextColor="#999"
              multiline
            />
            <View style={styles.noteModalButtons}>
              <TouchableOpacity
                style={styles.noteCancel}
                onPress={() => {
                  setNoteModalVisible(false);
                  setNoteText("");
                }}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteSave}
                onPress={async () => {
                  await shiftService.setCurrentBreakNote(noteText.trim());
                  setNoteModalVisible(false);
                  setNoteText("");
                  await refreshTimer();
                }}
              >
                <ThemedText style={{ color: "white" }}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

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
            Enter the start and end times of your shift in 24-hour format
            (HH:MM). Overnight shifts are supported.
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
  primaryActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionFlex: {
    flex: 1,
  },
  breakTimerContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  breakTimerLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  breakTimerValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  breakHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakHistoryContainer: {
    width: "100%",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  breakHistoryTitle: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.7,
    marginBottom: 4,
  },
  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  breakIndex: {
    fontSize: 12,
    opacity: 0.7,
  },
  breakDuration: {
    fontSize: 14,
    fontWeight: "600",
  },
  breakStatus: {
    fontSize: 12,
    opacity: 0.7,
  },
  breakTimes: {
    fontSize: 12,
    opacity: 0.7,
  },
  breakTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  breakTotalLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  breakTotalValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  breakNote: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  undoButton: {
    backgroundColor: "#F0F0F5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  undoButtonText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "600",
  },
  noteButton: {
    backgroundColor: "#F0F0F5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  noteButtonText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "600",
  },
  noteModalOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  noteModal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  noteModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  noteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteCancel: {
    padding: 12,
  },
  noteSave: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#007AFF",
    borderRadius: 10,
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
  breakToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  breakToggleLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
});
