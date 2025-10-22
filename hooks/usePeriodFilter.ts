import { AppSettings } from "@/types/settings";
import { useMemo, useState } from "react";

export type PeriodType = "week" | "month" | "all";

interface UsePeriodFilterProps {
  settings: AppSettings | null;
  initialPeriod?: PeriodType;
}

export const usePeriodFilter = ({
  settings,
  initialPeriod = "week",
}: UsePeriodFilterProps) => {
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
      daysSinceWeekStart = 7 - startDayNum + currentDayNum;
    }

    // Calculate the start of the current week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceWeekStart);
    weekStart.setHours(0, 0, 0, 0);

    // Apply offset (positive = future weeks, negative = past weeks)
    weekStart.setDate(weekStart.getDate() + offset * 7);

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
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentMonthRange = (offset: number = 0) => {
    const now = new Date();
    const monthlyStartDate = settings?.payRules?.payPeriod?.startDate || 1;

    // Get current date in LOCAL timezone (not UTC) to avoid timezone issues
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // If it's the default monthly start date (1st), use standard calendar month
    if (monthlyStartDate === 1) {
      let startYear = currentYear;
      let startMonth = currentMonth;
      let endYear = currentYear;
      let endMonth = currentMonth;

      // Apply offset
      startMonth += offset;
      endMonth += offset;

      // Handle month overflow
      while (startMonth < 0) {
        startMonth += 12;
        startYear -= 1;
      }
      while (startMonth >= 12) {
        startMonth -= 12;
        startYear += 1;
      }
      while (endMonth < 0) {
        endMonth += 12;
        endYear -= 1;
      }
      while (endMonth >= 12) {
        endMonth -= 12;
        endYear += 1;
      }

      const startDate = new Date(startYear, startMonth, 1);
      const endDate = new Date(endYear, endMonth + 1, 0); // Last day of the month

      return {
        start: `${startYear}-${String(startMonth + 1).padStart(2, "0")}-01`,
        end: `${endYear}-${String(endMonth + 1).padStart(2, "0")}-${String(
          endDate.getDate()
        ).padStart(2, "0")}`,
      };
    }

    // Custom monthly period logic - work with simple numbers to avoid timezone issues
    // (currentYear, currentMonth, currentDay already declared above)

    // Determine which custom monthly period we're in
    let periodStartYear: number;
    let periodStartMonth: number;
    let periodEndYear: number;
    let periodEndMonth: number;
    let periodEndDay: number;

    if (currentDay >= monthlyStartDate) {
      // We're in the current month's period
      periodStartYear = currentYear;
      periodStartMonth = currentMonth;
      periodEndYear = currentYear;
      periodEndMonth = currentMonth + 1;
      periodEndDay = monthlyStartDate - 1;
    } else {
      // We're in the previous month's period
      periodStartYear = currentYear;
      periodStartMonth = currentMonth - 1;
      periodEndYear = currentYear;
      periodEndMonth = currentMonth;
      periodEndDay = monthlyStartDate - 1;
    }

    // Apply offset by moving to different periods
    if (offset !== 0) {
      periodStartMonth += offset;
      periodEndMonth += offset;
    }

    // Handle month overflow for start
    while (periodStartMonth < 0) {
      periodStartMonth += 12;
      periodStartYear -= 1;
    }
    while (periodStartMonth >= 12) {
      periodStartMonth -= 12;
      periodStartYear += 1;
    }

    // Handle month overflow for end
    while (periodEndMonth < 0) {
      periodEndMonth += 12;
      periodEndYear -= 1;
    }
    while (periodEndMonth >= 12) {
      periodEndMonth -= 12;
      periodEndYear += 1;
    }

    // Handle end day overflow (e.g., if monthlyStartDate is 1, end day would be 0)
    if (periodEndDay <= 0) {
      periodEndMonth -= 1;
      if (periodEndMonth < 0) {
        periodEndMonth = 11;
        periodEndYear -= 1;
      }
      // Get the last day of the previous month
      const lastMonthDate = new Date(periodEndYear, periodEndMonth + 1, 0);
      periodEndDay = lastMonthDate.getDate();
    }

    const result = {
      start: `${periodStartYear}-${String(periodStartMonth + 1).padStart(
        2,
        "0"
      )}-${String(monthlyStartDate).padStart(2, "0")}`,
      end: `${periodEndYear}-${String(periodEndMonth + 1).padStart(
        2,
        "0"
      )}-${String(periodEndDay).padStart(2, "0")}`,
    };

    return result;
  };

  const currentDateRange = useMemo(() => {
    const result = (() => {
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
    })();

    return result;
  }, [
    currentPeriod,
    currentWeekOffset,
    currentMonthOffset,
    settings?.payRules?.payPeriod?.startDate,
  ]);

  const handlePeriodChange = (period: PeriodType) => {
    setCurrentPeriod(period);
    // Reset offsets when changing period type
    setCurrentWeekOffset(0);
    setCurrentMonthOffset(0);
  };

  const handleNavigatePrevious = () => {
    if (currentPeriod === "week") {
      setCurrentWeekOffset((prev) => prev - 1);
    } else if (currentPeriod === "month") {
      setCurrentMonthOffset((prev) => prev - 1);
    }
  };

  const handleNavigateNext = () => {
    if (currentPeriod === "week") {
      setCurrentWeekOffset((prev) => prev + 1);
    } else if (currentPeriod === "month") {
      setCurrentMonthOffset((prev) => prev + 1);
    }
  };

  const handleJumpToCurrent = () => {
    setCurrentWeekOffset(0);
    setCurrentMonthOffset(0);
  };

  const isInCurrentPeriod = (dateString: string): boolean => {
    if (currentPeriod === "all") {
      return true;
    }

    if (!currentDateRange) {
      return false;
    }

    // Simple string comparison to avoid timezone issues
    const isInRange =
      dateString >= currentDateRange.start &&
      dateString <= currentDateRange.end;

    return isInRange;
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
