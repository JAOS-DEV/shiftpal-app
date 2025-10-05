import React, { useState } from "react";
import {
    StyleSheet,
    Switch,
    View,
} from "react-native";
import { useTimer } from "../../hooks/useTimer";
import { ThemedText } from "../ThemedText";
import { BreakHistory } from "./BreakHistory";
import { NoteModal } from "./NoteModal";
import { TimerControls } from "./TimerControls";

interface TimerModeInputProps {
  includeBreaks: boolean;
  onIncludeBreaksChange: (value: boolean) => void;
  onShiftListRefresh?: () => void;
}

export const TimerModeInput: React.FC<TimerModeInputProps> = ({
  includeBreaks,
  onIncludeBreaksChange,
  onShiftListRefresh,
}) => {
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");

  const {
    timerState,
    handleTimerStart,
    handleTimerPauseResume,
    handleTimerStop,
    handleUndoLastBreak,
    handleSaveNote,
  } = useTimer(includeBreaks, onShiftListRefresh);

  const handleSaveNoteAndClose = async (): Promise<void> => {
    await handleSaveNote(noteText);
    setNoteModalVisible(false);
    setNoteText("");
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

        <BreakHistory 
          breaks={timerState.breaks || []} 
          totalBreakMs={timerState.totalBreakMs} 
        />

        <View style={styles.breakToggleRow}>
          <ThemedText style={styles.breakToggleLabel}>
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
  },
  timerElapsed: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    color: "#007AFF",
  },
  breakTimerContainer: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  breakTimerLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    marginBottom: 2,
  },
  breakTimerValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FF9500",
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