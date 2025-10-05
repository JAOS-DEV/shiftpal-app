import { AppSettings } from "@/types/settings";
import { useMemo, useState } from "react";

export type PeriodType = "week" | "month" | "all";

interface UsePeriodFilterProps {
  settings: AppSettings | null;
  initialPeriod?: PeriodType;
}

export const usePeriodFilter = ({ settings, initialPeriod = "week" }: UsePeriodFilterProps) => {
  const [currentPeriod, setCurrentPeriod] = useState<PeriodType>(initialPeriod);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  const getWeekStartDay = (): number => {
    const weekStartDay = settings?.payRules?.payPeriod?.startDay || "Monday";
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return dayMap[weekStartDay] ?? 1; // Default to Monday
  };

  const getCurrentWeekRange = (offset: number = 0) => {
    const now = new Date();
    const startDayNum = getWeekStartDay();
    const currentDayNum = now.getDay();
    
    // Calculate days since the start of the current week
    // If current day is before start day in the week, we need to go back to previous week's start
    let daysSinceWeekStart;
    if (currentDayNum >= startDayNum) {
      daysSinceWeekStart = currentDayNum - startDayNum;
    } else {
      daysSinceWeekStart = (7 - startDayNum) + currentDayNum;
    }
    
    // Calculate the start of the current week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceWeekStart);
    weekStart.setHours(0, 0, 0, 0);
    
    // Apply offset (positive = future weeks, negative = past weeks)
    weekStart.setDate(weekStart.getDate() + (offset * 7));
    
    // Calculate the end of the week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      start: formatDateString(weekStart),
      end: formatDateString(weekEnd),
    };
  };

  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentMonthRange = (offset: number = 0) => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    
    const monthStart = new Date(targetMonth);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    return {
      start: formatDateString(monthStart),
      end: formatDateString(monthEnd),
    };
  };

  const currentDateRange = useMemo(() => {
    switch (currentPeriod) {
      case "week":
        return getCurrentWeekRange(currentWeekOffset);
      case "month":
        return getCurrentMonthRange(currentMonthOffset);
      case "all":
        return null;
      default:
        return null;
    }
  }, [currentPeriod, currentWeekOffset, currentMonthOffset, settings]);

  const handlePeriodChange = (period: PeriodType) => {
    setCurrentPeriod(period);
    // Reset offsets when changing period type
    setCurrentWeekOffset(0);
    setCurrentMonthOffset(0);
  };

  const handleNavigatePrevious = () => {
    if (currentPeriod === "week") {
      setCurrentWeekOffset(prev => prev - 1);
    } else if (currentPeriod === "month") {
      setCurrentMonthOffset(prev => prev - 1);
    }
  };

  const handleNavigateNext = () => {
    if (currentPeriod === "week") {
      setCurrentWeekOffset(prev => prev + 1);
    } else if (currentPeriod === "month") {
      setCurrentMonthOffset(prev => prev + 1);
    }
  };

  const handleJumpToCurrent = () => {
    setCurrentWeekOffset(0);
    setCurrentMonthOffset(0);
  };

  const isInCurrentPeriod = (dateString: string): boolean => {
    if (currentPeriod === "all") return true;
    if (!currentDateRange) return false;
    
    const date = new Date(dateString + "T00:00:00");
    const start = new Date(currentDateRange.start + "T00:00:00");
    const end = new Date(currentDateRange.end + "T23:59:59");
    
    return date >= start && date <= end;
  };

  return {
    currentPeriod,
    currentDateRange,
    handlePeriodChange,
    handleNavigatePrevious,
    handleNavigateNext,
    handleJumpToCurrent,
    isInCurrentPeriod,
  };
};
