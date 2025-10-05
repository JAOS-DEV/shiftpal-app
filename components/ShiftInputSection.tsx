import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ManualModeInput } from "./shift-input/ManualModeInput";
import { TimerModeInput } from "./shift-input/TimerModeInput";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface ShiftInputSectionProps {
  onAddShift: (startTime: string, endTime: string) => void;
  onShiftListRefresh?: () => void;
}

const STORAGE_KEYS = {
  mode: "shiftpal.preferences.input_mode",
  includeBreaks: "shiftpal.preferences.include_breaks",
} as const;

export function ShiftInputSection({
  onAddShift,
  onShiftListRefresh,
}: ShiftInputSectionProps): React.JSX.Element {
  const [mode, setMode] = useState<"manual" | "timer">("manual");
  const [includeBreaks, setIncludeBreaks] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    const loadPreferences = async (): Promise<void> => {
      try {
        const [savedMode, savedIncludeBreaks] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.mode),
          AsyncStorage.getItem(STORAGE_KEYS.includeBreaks),
        ]);
        if (savedMode === "manual" || savedMode === "timer") {
          setMode(savedMode);
        }
        if (savedIncludeBreaks === "true" || savedIncludeBreaks === "false") {
          setIncludeBreaks(savedIncludeBreaks === "true");
        }
      } catch {}
    };
    void loadPreferences();
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

  const handleManualMode = useCallback(() => {
    setMode("manual");
  }, []);

  const handleTimerMode = useCallback(() => {
    setMode("timer");
  }, []);

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
            onPress={handleManualMode}
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
            onPress={handleTimerMode}
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
      </View>

      {mode === "manual" ? (
        <ManualModeInput onAddShift={onAddShift} />
      ) : (
        <TimerModeInput
          includeBreaks={includeBreaks}
          onIncludeBreaksChange={setIncludeBreaks}
          onShiftListRefresh={onShiftListRefresh}
        />
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
});
