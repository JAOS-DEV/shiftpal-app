import { useCallback } from "react";

interface HoursAndMinutes {
  hours: number;
  minutes: number;
}

export const useTimeCalculations = () => {
  const hmToMinutes = useCallback((hm: HoursAndMinutes | undefined | null): number => {
    const h = Math.max(0, hm?.hours ?? 0);
    const m = Math.max(0, hm?.minutes ?? 0);
    return h * 60 + m;
  }, []);

  const minutesToHMText = useCallback((minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }, []);

  const formatHMClock = useCallback((hm: HoursAndMinutes): string => {
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  }, []);

  const formatTimeOfDay = useCallback((ts: number): string => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  }, []);

  const calculateTotalMinutes = useCallback((shifts: Array<{ durationMinutes: number }>): number => {
    return shifts.reduce((sum, shift) => sum + shift.durationMinutes, 0);
  }, []);

  const formatDurationText = useCallback((totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }, []);

  return {
    hmToMinutes,
    minutesToHMText,
    formatHMClock,
    formatTimeOfDay,
    calculateTotalMinutes,
    formatDurationText,
  };
};
