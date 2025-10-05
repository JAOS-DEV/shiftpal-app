import { shiftService } from "@/services/shiftService";
import { notify } from "@/utils/notify";
import { getCurrentDateString } from "@/utils/timeUtils";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";

interface TimerState {
  running: boolean;
  paused: boolean;
  startedAt?: number;
  elapsedMs: number;
  currentBreakMs?: number;
  breaks?: Array<{ start: number; end?: number; durationMs: number; note?: string }>;
  totalBreakMs?: number;
}

export const useTimer = (includeBreaks: boolean, onShiftListRefresh?: () => void) => {
  const [timerState, setTimerState] = useState<TimerState>({
    running: false,
    paused: false,
    elapsedMs: 0,
  });
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

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
    const currentBreakMs = t.status === "paused" && t.pauses.length > 0 ? 
      Math.max(0, now - (t.pauses[t.pauses.length - 1]?.start ?? 0)) : undefined;
    
    setTimerState({
      running: true,
      paused: t.status === "paused",
      startedAt: t.startedAt,
      elapsedMs,
      currentBreakMs,
      breaks: t.pauses.map(p => ({
        start: p.start,
        end: p.end,
        durationMs: p.durationMs,
        note: p.note,
      })),
      totalBreakMs: t.pauses.reduce((sum, p) => sum + p.durationMs, 0),
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
    notify.success("Shift saved", `${shift.durationText}${suffix}`);
  };

  const handleUndoLastBreak = async (): Promise<void> => {
    await Haptics.selectionAsync();
    await shiftService.undoLastBreak();
    await refreshTimer();
  };

  const handleSaveNote = async (noteText: string): Promise<void> => {
    await shiftService.setCurrentBreakNote(noteText.trim());
    await refreshTimer();
  };

  return {
    timerState,
    handleTimerStart,
    handleTimerPauseResume,
    handleTimerStop,
    handleUndoLastBreak,
    handleSaveNote,
  };
};
