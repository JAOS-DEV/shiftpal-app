import { useTheme } from "@/providers/ThemeProvider";
import React, { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useTimer } from "@/hooks/useTimer";
import { ThemedText } from "../../ui/ThemedText";
import { BreakHistory } from "./BreakHistory";
import { NoteModal } from "./NoteModal";
import { TimerControls } from "./TimerControls";

interface TimerModeInputProps {
  includeBreaks: boolean;
  onIncludeBreaksChange: (value: boolean) => void;
  onShiftListRefresh?: () => void;
  selectedDate?: string;
}

export const TimerModeInput: React.FC<TimerModeInputProps> = ({
  includeBreaks,
  onIncludeBreaksChange,
  onShiftListRefresh,
  selectedDate,
}) => {
  const { colors } = useTheme();
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");

  const {
    timerState,
    handleTimerStart,
    handleTimerPauseResume,
    handleTimerStop,
    handleUndoLastBreak,
    handleSaveNote,
  } = useTimer(includeBreaks, onShiftListRefresh, selectedDate);

  const handleSaveNoteAndClose = async (): Promise<void> => {
    await handleSaveNote(noteText);
    setNoteModalVisible(false);
    setNoteText("");
  };

  // Helper function to safely format milliseconds as HH:MM:SS
  const formatTimeFromMs = (ms: number): string => {
    if (!Number.isFinite(ms) || ms < 0) {
      return "00:00:00";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <View style={styles.timerContainer}>
        <ThemedText style={[styles.timerElapsed, { color: colors.primary }]}>
          {formatTimeFromMs(timerState.elapsedMs)}
        </ThemedText>

        {timerState.paused && typeof timerState.currentBreakMs === "number" ? (
          <View
            style={[
              styles.breakTimerContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <ThemedText
              style={[styles.breakTimerLabel, { color: colors.textSecondary }]}
            >
              Break time
            </ThemedText>
            <ThemedText
              style={[styles.breakTimerValue, { color: colors.warning }]}
            >
              {formatTimeFromMs(timerState.currentBreakMs)}
            </ThemedText>
          </View>
        ) : null}

        <BreakHistory
          breaks={timerState.breaks || []}
          totalBreakMs={timerState.totalBreakMs}
        />

        <View style={styles.breakToggleRow}>
          <ThemedText style={[styles.breakToggleLabel, { color: colors.text }]}>
            Include breaks in total
          </ThemedText>
          <Switch value={includeBreaks} onValueChange={onIncludeBreaksChange} />
        </View>

        <TimerControls
          timerState={timerState}
          onStart={handleTimerStart}
          onPauseResume={handleTimerPauseResume}
          onStop={handleTimerStop}
          onAddNote={() => setNoteModalVisible(true)}
          onUndoBreak={handleUndoLastBreak}
        />
      </View>

      <NoteModal
        visible={noteModalVisible}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onSave={handleSaveNoteAndClose}
        onCancel={() => {
          setNoteModalVisible(false);
          setNoteText("");
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  timerElapsed: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    color: "#007AFF", // Will be overridden by theme
    lineHeight: 56, // Ensure proper line height for large text
  },
  breakTimerContainer: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#F2F2F7", // Will be overridden by theme
    borderRadius: 8,
  },
  breakTimerLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666", // Will be overridden by theme
    marginBottom: 2,
  },
  breakTimerValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FF9500", // Will be overridden by theme
  },
  breakToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  breakToggleLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});
