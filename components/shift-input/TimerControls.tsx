import React from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface TimerControlsProps {
  timerState: {
    running: boolean;
    paused: boolean;
  };
  onStart: () => void;
  onPauseResume: () => void;
  onStop: () => void;
  onAddNote: () => void;
  onUndoBreak: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  timerState,
  onStart,
  onPauseResume,
  onStop,
  onAddNote,
  onUndoBreak,
}) => {
  if (!timerState.running) {
    return (
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onStart}
      >
        <ThemedText style={styles.primaryButtonText}>Start</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <View style={styles.primaryActionsRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.actionFlex]}
          onPress={onPauseResume}
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
          onPress={onStop}
        >
          <ThemedText style={styles.dangerButtonText}>Stop</ThemedText>
        </TouchableOpacity>
      </View>

      {timerState.paused ? (
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            style={[styles.noteButton, styles.actionFlex]}
            onPress={onAddNote}
            accessibilityLabel="Add note to current break"
          >
            <ThemedText style={styles.noteButtonText}>Add note</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.undoButton, styles.actionFlex]}
            onPress={onUndoBreak}
            accessibilityLabel="Undo last break"
          >
            <ThemedText style={styles.undoButtonText}>
              Undo break
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
};

const styles = {
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center" as const,
    width: "100%",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  primaryActionsRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 8,
  },
  secondaryActionsRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: "#F2F2F7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  dangerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  noteButton: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  noteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  undoButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  undoButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  actionFlex: {
    flex: 1,
  },
};
