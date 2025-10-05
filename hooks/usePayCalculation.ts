import { settingsService } from "@/services/settingsService";
import { AppSettings, HoursAndMinutes, PayBreakdown, PayCalculationInput } from "@/types/settings";
import { useCallback, useEffect, useState } from "react";

interface UsePayCalculationProps {
  settings: AppSettings | null;
  mode: "tracker" | "manual";
  date: string;
  hourlyRateId: string | null;
  overtimeRateId: string | null;
  manualBaseRateText: string;
  manualOvertimeRateText: string;
  trackerHoursWorked: HoursAndMinutes;
  trackerOvertimeWorked: HoursAndMinutes;
  manualHoursWorked: HoursAndMinutes;
  manualOvertimeWorked: HoursAndMinutes;
  manualNightBase: HoursAndMinutes;
  manualNightOt: HoursAndMinutes;
}

export const usePayCalculation = ({
  settings,
  mode,
  date,
  hourlyRateId,
  overtimeRateId,
  manualBaseRateText,
  manualOvertimeRateText,
  trackerHoursWorked,
  trackerOvertimeWorked,
  manualHoursWorked,
  manualOvertimeWorked,
  manualNightBase,
  manualNightOt,
}: UsePayCalculationProps) => {
  const [breakdown, setBreakdown] = useState<PayBreakdown | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trackerDerivedSplit, setTrackerDerivedSplit] = useState<{
    base: HoursAndMinutes;
    overtime: HoursAndMinutes;
  } | null>(null);
  const [trackerNightHint, setTrackerNightHint] = useState<{
    base?: HoursAndMinutes;
    ot?: HoursAndMinutes;
  } | null>(null);

  const resolveRateValue = useCallback((id: string | null | undefined): number | undefined => {
    if (!id) return undefined;
    const list = settings?.payRates || [];
    return list.find((r) => r.id === id)?.value;
  }, [settings?.payRates]);

  const recalculatePay = useCallback(async (): Promise<void> => {
    if (!settings) return;

    let nightBaseHours: HoursAndMinutes | undefined;
    let nightOvertimeHours: HoursAndMinutes | undefined;
    let derivedSplit: {
      base: HoursAndMinutes;
      overtime: HoursAndMinutes;
    } | null = null;

    // Derive night allocation
    if (mode === "tracker") {
      try {
        const alloc = await settingsService.deriveTrackerNightAllocationForDate(
          date,
          settings
        );
        nightBaseHours = alloc.nightBase;
        nightOvertimeHours = alloc.nightOvertime;
        setTrackerNightHint(alloc);
      } catch {
        setTrackerNightHint(null);
      }
    } else {
      nightBaseHours = manualNightBase;
      nightOvertimeHours = manualNightOt;
    }

    // Choose hours for calculation
    let hoursWorked: HoursAndMinutes =
      mode === "tracker" ? trackerHoursWorked : manualHoursWorked;
    let overtimeWorked: HoursAndMinutes =
      mode === "tracker" ? trackerOvertimeWorked : manualOvertimeWorked;

    // Auto-derive tracker overtime split when OT not entered
    if (
      mode === "tracker" &&
      (overtimeWorked.hours || 0) === 0 &&
      (overtimeWorked.minutes || 0) === 0
    ) {
      try {
        const split = await settingsService.deriveTrackerOvertimeSplitForDate(
          date,
          settings
        );
        hoursWorked = split.base;
        overtimeWorked = split.overtime;
        derivedSplit = split;
        setTrackerDerivedSplit(split);
      } catch {
        setTrackerDerivedSplit(null);
      }
    }

    const input: PayCalculationInput = {
      mode,
      date,
      hourlyRateId,
      overtimeRateId,
      hoursWorked,
      overtimeWorked,
      nightBaseHours,
      nightOvertimeHours,
    };

    let result = settingsService.computePay(input, settings);

    // Manual override if needed
    const savedBase = resolveRateValue(hourlyRateId);
    const savedOt = resolveRateValue(overtimeRateId) ?? savedBase;
    const manualBase = parseFloat(manualBaseRateText || "");
    const manualOt = parseFloat(manualOvertimeRateText || "");

    if (manualBase > 0) {
      result = settingsService.computePay(
        { ...input, manualBaseRate: manualBase },
        settings
      );
    }
    if (manualOt > 0) {
      result = settingsService.computePay(
        { ...input, manualOvertimeRate: manualOt },
        settings
      );
    }

    setBreakdown(result);
  }, [
    settings,
    mode,
    date,
    hourlyRateId,
    overtimeRateId,
    manualBaseRateText,
    manualOvertimeRateText,
    trackerHoursWorked,
    trackerOvertimeWorked,
    manualHoursWorked,
    manualOvertimeWorked,
    manualNightBase,
    manualNightOt,
    resolveRateValue,
  ]);

  const savePayCalculation = useCallback(async (): Promise<void> => {
    if (!breakdown || !settings) return;
    
    setIsSaving(true);
    try {
      await settingsService.savePayCalculation({
        input: {
          mode,
          date,
          hourlyRateId,
          overtimeRateId,
          hoursWorked: mode === "tracker" ? trackerHoursWorked : manualHoursWorked,
          overtimeWorked: mode === "tracker" ? trackerOvertimeWorked : manualOvertimeWorked,
          nightBaseHours: mode === "tracker" ? trackerNightHint?.base : manualNightBase,
          nightOvertimeHours: mode === "tracker" ? trackerNightHint?.ot : manualNightOt,
        },
        calculatedPay: breakdown,
        rateSnapshot: {
          base: resolveRateValue(hourlyRateId) ?? 0,
          overtime: resolveRateValue(overtimeRateId) ?? resolveRateValue(hourlyRateId) ?? 0,
        },
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    breakdown,
    settings,
    mode,
    date,
    hourlyRateId,
    overtimeRateId,
    trackerHoursWorked,
    manualHoursWorked,
    trackerOvertimeWorked,
    manualOvertimeWorked,
    trackerNightHint,
    manualNightBase,
    manualNightOt,
    resolveRateValue,
  ]);

  // Recalculate whenever dependencies change
  useEffect(() => {
    void recalculatePay();
  }, [recalculatePay]);

  return {
    breakdown,
    isSaving,
    trackerDerivedSplit,
    trackerNightHint,
    recalculatePay,
    savePayCalculation,
    resolveRateValue,
  };
};
