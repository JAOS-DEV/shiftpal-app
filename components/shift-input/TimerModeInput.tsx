import { shiftService } from "@/services/shiftService";
import { notify } from "@/utils/notify";
import { getCurrentDateString } from "@/utils/timeUtils";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { IconSymbol } from "../ui/IconSymbol";

interface TimerModeInputProps {
  includeBreaks: boolean;
  onIncludeBreaksChange: (value: boolean) => void;
  onShiftListRefresh?: () => void;
}

interface TimerState {
  running: boolean;
  paused: boolean;
  startedAt?: number;
  elapsedMs: number;
  currentBreakMs?: number;
  breaks?: Array<{ start: number; end?: number; durationMs: number; note?: string }>;
  totalBreakMs?: number;
}

export const TimerModeInput: React.FC<TimerModeInputProps> = ({
  includeBreaks,
  onIncludeBreaksChange,
  onShiftListRefresh,
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    running: false,
    paused: false,
    elapsedMs: 0,
  });
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showBreakHistory, setShowBreakHistory] = useState(true);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");

  const refreshTimer = async (): Promise<void> => {
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
    const breaks = t.pauses.map((p) => {
      const effectiveEnd = p.end ?? (t.status === "paused" ? now : undefined);
      const durationMs = Math.max(0, (effectiveEnd ?? now) - p.start);
      return {
        start: p.start,
        end: p.end,
        durationMs,
        note: p.note,
      };
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
    void refreshTimer();
    const id = setInterval(() => {
      void refreshTimer();
    }, 1000);
    setTimerInterval(id);
    return () => {
      if (id) clearInterval(id);
    };
  }, []);

  const handleTimerStart = async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await shiftService.startTimer(getCurrentDateString());
    await refreshTimer();
  };

  const handleTimerPauseResume = async (): Promise<void> => {
    if (timerState.paused) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await shiftService.resumeTimer();
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await shiftService.pauseTimer();
    }
    await refreshTimer();
  };

  const handleTimerStop = async (): Promise<void> => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const shift = await shiftService.stopTimer(includeBreaks);
    await refreshTimer();
    if (!shift) return;
    onShiftListRefresh?.();
    const suffix = shift.breakMinutes
      ? includeBreaks
        ? ` (breaks ${shift.breakMinutes}m included)`
        : ` (breaks ${shift.breakMinutes}m excluded)`
      : "";
    notify.success("Shift added", `Recorded ${shift.durationText}${suffix}`);
  };

  const handleUndoLastBreak = async (): Promise<void> => {
    await Haptics.selectionAsync();
    await shiftService.undoLastBreak();
    await refreshTimer();
  };

  const handleSaveNote = async (): Promise<void> => {
    await shiftService.setCurrentBreakNote(noteText.trim());
    setNoteModalVisible(false);
    setNoteText("");
    await refreshTimer();
  };

  return (
    <>
      <View style={styles.timerContainer}>
        <ThemedText style={styles.timerElapsed}>
          {new Date(timerState.elapsedMs).toISOString().substr(11, 8)}
        </ThemedText>

        {timerState.paused && typeof timerState.currentBreakMs === "number" ? (
          <View style={styles.breakTimerContainer}>
            <ThemedText style={styles.breakTimerLabel}>Break time</ThemedText>
            <ThemedText style={styles.breakTimerValue}>
              {new Date(timerState.currentBreakMs).toISOString().substr(11, 8)}
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
                  transform: [{ rotate: showBreakHistory ? "90deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>
            {showBreakHistory ? (
              <>
                {timerState.breaks.map((b, idx) => (
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
                      <ThemedText style={styles.breakNote}>{b.note}</ThemedText>
                    ) : null}
                  </View>
                ))}
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
          <Switch value={includeBreaks} onValueChange={onIncludeBreaksChange} />
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
                  <ThemedText style={styles.noteButtonText}>Add note</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.undoButton, styles.actionFlex]}
                  onPress={handleUndoLastBreak}
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
                onPress={handleSaveNote}
              >
                <ThemedText style={{ color: "white" }}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    gap: 12,
  },
  timerElapsed: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    marginVertical: 16,
  },
  breakTimerContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  breakTimerLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  breakTimerValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF9500",
    fontVariant: ["tabular-nums"],
  },
  breakHistoryContainer: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  breakHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  breakHistoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
  },
  breakRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 4,
  },
  breakIndex: {
    fontSize: 12,
    opacity: 0.5,
  },
  breakDuration: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  breakTimes: {
    fontSize: 13,
    opacity: 0.7,
  },
  breakNote: {
    fontSize: 13,
    fontStyle: "italic",
    opacity: 0.7,
    marginTop: 2,
  },
  breakTotalRow: {
    borderTopWidth: 2,
    borderTopColor: "#E5E5EA",
    marginTop: 8,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  breakTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
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
  primaryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionFlex: {
    flex: 1,
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
  noteButton: {
    backgroundColor: "#F0F0F5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  noteButtonText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "600",
  },
  undoButton: {
    backgroundColor: "#F0F0F5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  undoButtonText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "600",
  },
  noteModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noteModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
    marginBottom: 16,
  },
  noteModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  noteCancel: {
    flex: 1,
    backgroundColor: "#F0F0F5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  noteSave: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
});

