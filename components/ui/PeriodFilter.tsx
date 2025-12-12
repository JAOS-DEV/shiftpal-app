import { useTheme } from "@/providers/ThemeProvider";
import { AppSettings } from "@/types/settings";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";

export type PeriodType = "week" | "month" | "all";

interface PeriodFilterProps {
  activePeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  settings: AppSettings | null;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onJumpToCurrent: () => void;
  currentDateRange: {
    start: string;
    end: string;
  } | null;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  activePeriod,
  onPeriodChange,
  settings,
  onNavigatePrevious,
  onNavigateNext,
  onJumpToCurrent,
  currentDateRange,
}) => {
  const { colors } = useTheme();

  const formatDateRange = (
    start: string,
    end: string,
    period: PeriodType
  ): string => {
    try {
      if (period === "month") {
        // For month view, show custom period if it's not a standard calendar month
        const startDate = new Date(start + "T00:00:00");
        const endDate = new Date(end + "T00:00:00");
        const monthlyStartDate = settings?.payRules?.payPeriod?.startDate;

        // Check if this is a custom monthly period (not starting on 1st)
        if (monthlyStartDate && monthlyStartDate !== 1) {
          const startDay = startDate.getDate();
          const startMonth = startDate.toLocaleDateString("en-US", {
            month: "short",
          });
          const startYear = startDate.getFullYear();
          const endDay = endDate.getDate();
          const endMonth = endDate.toLocaleDateString("en-US", {
            month: "short",
          });
          const endYear = endDate.getFullYear();

          if (startYear === endYear && startMonth === endMonth) {
            return `${startDay}-${endDay} ${startMonth} ${startYear}`;
          } else {
            return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
          }
        } else {
          // Standard calendar month
          return startDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });
        }
      } else {
        // For week view, show the date range
        const startDate = new Date(start + "T00:00:00");
        const endDate = new Date(end + "T00:00:00");

        const startDay = startDate.toLocaleDateString("en-US", {
          weekday: "short",
        });
        const startMonth = startDate.toLocaleDateString("en-US", {
          month: "short",
        });
        const startDayNum = startDate.getDate();

        const endDay = endDate.toLocaleDateString("en-US", {
          weekday: "short",
        });
        const endMonth = endDate.toLocaleDateString("en-US", {
          month: "short",
        });
        const endDayNum = endDate.getDate();

        if (startMonth === endMonth) {
          return `${startDay} ${startDayNum} - ${endDay} ${endDayNum} ${startMonth}`;
        } else {
          return `${startDay} ${startDayNum} ${startMonth} - ${endDay} ${endDayNum} ${endMonth}`;
        }
      }
    } catch {
      return "Invalid date range";
    }
  };

  const getCurrentButtonText = (): string => {
    switch (activePeriod) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "all":
        return "All";
      default:
        return "Current";
    }
  };

  const getPeriodLabel = (): string => {
    switch (activePeriod) {
      case "week":
        return "WEEK";
      case "month":
        return "MONTH";
      case "all":
        return "ALL";
      default:
        return "PERIOD";
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Period Label */}
      <ThemedText style={[styles.periodLabel, { color: colors.textSecondary }]}>
        {getPeriodLabel()}
      </ThemedText>

      {/* Period Selection Buttons */}
      <View style={styles.periodButtons}>
        {(["week", "month", "all"] as PeriodType[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              { borderColor: colors.border },
              activePeriod === period && [
                styles.activePeriodButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ],
            ]}
            onPress={() => onPeriodChange(period)}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                { color: colors.text },
                activePeriod === period && [
                  styles.activePeriodButtonText,
                  { color: "white" },
                ],
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Range and Navigation (only show for week/month) */}
      {activePeriod !== "all" && currentDateRange && (
        <View style={styles.navigationContainer}>
          {/* Previous Arrow */}
          <TouchableOpacity
            style={[styles.navButton, { borderColor: colors.border }]}
            onPress={onNavigatePrevious}
          >
            <ThemedText style={[styles.navButtonText, { color: colors.text }]}>
              ←
            </ThemedText>
          </TouchableOpacity>

          {/* Current Period Button */}
          <TouchableOpacity
            style={[styles.currentButton, { borderColor: colors.border }]}
            onPress={onJumpToCurrent}
          >
            <ThemedText
              style={[styles.currentButtonText, { color: colors.text }]}
            >
              {getCurrentButtonText()}
            </ThemedText>
          </TouchableOpacity>

          {/* Date Range Display */}
          <View style={styles.dateRangeContainer}>
            <ThemedText style={[styles.dateRangeText, { color: colors.text }]}>
              {formatDateRange(
                currentDateRange.start,
                currentDateRange.end,
                activePeriod
              )}
            </ThemedText>
          </View>

          {/* Next Arrow */}
          <TouchableOpacity
            style={[styles.navButton, { borderColor: colors.border }]}
            onPress={onNavigateNext}
          >
            <ThemedText style={[styles.navButtonText, { color: colors.text }]}>
              →
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  periodButtons: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activePeriodButton: {
    // backgroundColor and borderColor set dynamically
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activePeriodButtonText: {
    color: "white",
  },
  navigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  currentButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  currentButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateRangeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
