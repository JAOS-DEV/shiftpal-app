import { DateSelector } from "@/components/DateSelector";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import {
  AppSettings,
  HoursAndMinutes,
  PayBreakdown,
  PayCalculationEntry,
  PayCalculationInput,
} from "@/types/settings";
import { notify } from "@/utils/notify";
import { formatDateDisplay, getCurrentDateString } from "@/utils/timeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { PayBreakdownCard } from "./PayBreakdownCard";
import { styles } from "./PayCalculatorTab.styles";
import { PayHoursInput } from "./PayHoursInput";
import { PayRatesInput } from "./PayRatesInput";

type Mode = "tracker" | "manual";

const STORAGE_KEYS = {
  baseRateId: "shiftpal.preferences.last_base_rate_id",
  overtimeRateId: "shiftpal.preferences.last_overtime_rate_id",
} as const;

interface PayCalculatorTabProps {
  settings: AppSettings | null;
  loadingSettings: boolean;
  onPaySaved: () => void;
  // Manual rate state lifted from parent to persist across tab switches
  manualBaseRateText: string;
  manualOvertimeRateText: string;
  onManualBaseRateTextChange: (value: string) => void;
  onManualOvertimeRateTextChange: (value: string) => void;
}

export const PayCalculatorTab: React.FC<PayCalculatorTabProps> = ({
  settings,
  loadingSettings,
  onPaySaved,
  manualBaseRateText,
  manualOvertimeRateText,
  onManualBaseRateTextChange,
  onManualOvertimeRateTextChange,
}): React.JSX.Element => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [mode, setMode] = useState<Mode>("tracker");
  const [date, setDate] = useState<string>(getCurrentDateString());
  const [hourlyRateId, setHourlyRateId] = useState<string | null>(null);
  const [overtimeRateId, setOvertimeRateId] = useState<string | null>(null);

  // Persist rate selections when they change
  useEffect(() => {
    if (hourlyRateId) {
      AsyncStorage.setItem(STORAGE_KEYS.baseRateId, hourlyRateId).catch(
        () => {}
      );
    }
  }, [hourlyRateId]);

  useEffect(() => {
    if (overtimeRateId) {
      AsyncStorage.setItem(STORAGE_KEYS.overtimeRateId, overtimeRateId).catch(
        () => {}
      );
    }
  }, [overtimeRateId]);

  // Tracker mode hours
  const [trackerHoursWorked, setTrackerHoursWorked] = useState<HoursAndMinutes>(
    {
      hours: 0,
      minutes: 0,
    }
  );
  const [trackerOvertimeWorked, setTrackerOvertimeWorked] =
    useState<HoursAndMinutes>({
      hours: 0,
      minutes: 0,
    });

  // Manual mode hours
  const [manualHoursWorked, setManualHoursWorked] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [manualOvertimeWorked, setManualOvertimeWorked] =
    useState<HoursAndMinutes>({
      hours: 0,
      minutes: 0,
    });

  // Manual night allocation
  const [manualNightBase, setManualNightBase] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [manualNightOt, setManualNightOt] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });

  const [breakdown, setBreakdown] = useState<PayBreakdown | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State for tracking shifts and pay rates for warnings
  const [hasShiftsForDate, setHasShiftsForDate] = useState(false);

  // Derived hints for tracker mode
  const [trackerDerivedSplit, setTrackerDerivedSplit] = useState<{
    base: HoursAndMinutes;
    overtime: HoursAndMinutes;
  } | null>(null);
  const [trackerNightHint, setTrackerNightHint] = useState<{
    base?: HoursAndMinutes;
    ot?: HoursAndMinutes;
  } | null>(null);

  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );

  // Reset component state when user changes (logout/login)
  useEffect(() => {
    // Reset all state to initial values when user changes
    setMode("tracker");
    setDate(getCurrentDateString());
    setHourlyRateId(null);
    setOvertimeRateId(null);
    // Note: manual rate text is now managed by parent, so we don't reset it here
    setTrackerHoursWorked({ hours: 0, minutes: 0 });
    setTrackerOvertimeWorked({ hours: 0, minutes: 0 });
    setManualHoursWorked({ hours: 0, minutes: 0 });
    setManualOvertimeWorked({ hours: 0, minutes: 0 });
    setManualNightBase({ hours: 0, minutes: 0 });
    setManualNightOt({ hours: 0, minutes: 0 });
    setBreakdown(null);
    setHasShiftsForDate(false);
    setTrackerDerivedSplit(null);
    setTrackerNightHint(null);
  }, [user?.uid]); // Reset when user ID changes

  // Load default rates and tracker hours when mode/date changes
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!settings) return;

      // Load persisted rate selections
      const [savedBaseRateId, savedOvertimeRateId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.baseRateId),
        AsyncStorage.getItem(STORAGE_KEYS.overtimeRateId),
      ]);

      const baseRates = settings.payRates.filter((r) => r.type === "base");
      const overtimeRates = settings.payRates.filter(
        (r) => r.type === "overtime"
      );

      // Set base rate: use saved, then first available, then custom
      if (savedBaseRateId && baseRates.find((r) => r.id === savedBaseRateId)) {
        setHourlyRateId(savedBaseRateId);
      } else if (baseRates.length > 0) {
        setHourlyRateId(baseRates[0].id);
      } else {
        setHourlyRateId("custom");
      }

      // Set overtime rate: use saved, then first available, then base rate, then custom
      if (
        savedOvertimeRateId &&
        overtimeRates.find((r) => r.id === savedOvertimeRateId)
      ) {
        setOvertimeRateId(savedOvertimeRateId);
      } else if (overtimeRates.length > 0) {
        setOvertimeRateId(overtimeRates[0].id);
      } else if (baseRates.length > 0) {
        setOvertimeRateId(baseRates[0].id);
      } else {
        setOvertimeRateId("custom");
      }

      if (mode === "tracker") {
        const hm = await settingsService.deriveTrackerHoursForDate(date);
        setTrackerHoursWorked(hm);

        // Check if there are shifts for this date
        const hasShifts = (hm.hours || 0) > 0 || (hm.minutes || 0) > 0;
        setHasShiftsForDate(hasShifts);
      }
    };
    void load();
  }, [mode, date, settings]);

  // Refresh tracker data when the screen is focused
  // This ensures that when users add shifts and navigate to pay calculator,
  // the tracker mode will show updated data
  useEffect(() => {
    const refreshTrackerData = async (): Promise<void> => {
      if (!isFocused || !settings || mode !== "tracker") return;

      try {
        const hm = await settingsService.deriveTrackerHoursForDate(date);
        setTrackerHoursWorked(hm);

        // Check if there are shifts for this date
        const hasShifts = (hm.hours || 0) > 0 || (hm.minutes || 0) > 0;
        setHasShiftsForDate(hasShifts);
      } catch (error) {
        console.error("Error refreshing tracker data:", error);
      }
    };

    // Refresh tracker data when screen is focused
    void refreshTrackerData();
  }, [isFocused, date, mode, settings]);

  // Recalculate pay whenever inputs change
  const recalc = async (): Promise<void> => {
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
      } catch {}
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
      } catch {}
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

    // Check if we have valid rates for calculation
    const savedBase = resolveRateValue(hourlyRateId);
    const savedOt = resolveRateValue(overtimeRateId) ?? savedBase;
    const manualBase = parseFloat(manualBaseRateText || "");
    const manualOt = parseFloat(manualOvertimeRateText || "");

    // If no valid rates are available, show zero breakdown
    if (!savedBase && !savedOt && manualBase <= 0 && manualOt <= 0) {
      result = {
        base: 0,
        overtime: 0,
        uplifts: 0,
        allowances: 0,
        gross: 0,
        tax: 0,
        ni: 0,
        total: 0,
      };
    }
    // If we have custom rates selected or manual rates, use manual calculation
    else if (
      hourlyRateId === "custom" ||
      overtimeRateId === "custom" ||
      ((!savedBase || !savedOt) && (manualBase > 0 || manualOt > 0))
    ) {
      const baseRate = savedBase || manualBase || 0;
      const otRate = savedOt || manualOt || baseRate;

      const baseHours = Math.max(
        0,
        (hoursWorked.hours || 0) + (hoursWorked.minutes || 0) / 60
      );
      const otHours = Math.max(
        0,
        (overtimeWorked.hours || 0) + (overtimeWorked.minutes || 0) / 60
      );

      const basePay = baseRate * baseHours;
      const otPay = otRate * otHours;
      const gross = basePay + otPay;

      // Apply tax and NI if configured
      const taxPct =
        typeof settings?.payRules?.tax?.percentage === "number"
          ? settings.payRules.tax.percentage
          : 0;
      const niPct =
        typeof settings?.payRules?.ni?.percentage === "number"
          ? settings.payRules.ni.percentage
          : 0;
      const tax = (taxPct / 100) * gross;
      const ni = (niPct / 100) * gross;
      const total = gross - tax - ni;

      result = {
        base: Math.round(basePay * 100) / 100,
        overtime: Math.round(otPay * 100) / 100,
        uplifts: 0,
        allowances: 0,
        gross: Math.round(gross * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        ni: Math.round(ni * 100) / 100,
        total: Math.round(total * 100) / 100,
      };
    }

    setBreakdown(result);
    setTrackerDerivedSplit(derivedSplit);
    setTrackerNightHint({ base: nightBaseHours, ot: nightOvertimeHours });
  };

  useEffect(() => {
    void recalc();
  }, [
    settings,
    mode,
    date,
    hourlyRateId,
    overtimeRateId,
    trackerHoursWorked,
    trackerOvertimeWorked,
    manualHoursWorked,
    manualOvertimeWorked,
    manualBaseRateText,
    manualOvertimeRateText,
  ]);

  const handleSave = async (): Promise<void> => {
    if (!breakdown) return;
    if (!hourlyRateId && !manualBaseRateText) {
      Alert.alert(
        "Rate required",
        "Please select a base rate in Settings or enter a manual base rate."
      );
      return;
    }

    setIsSaving(true);
    try {
      const entry: PayCalculationEntry = {
        id: Date.now().toString(36),
        input: {
          mode,
          date,
          hourlyRateId,
          overtimeRateId,
          hoursWorked:
            mode === "tracker" ? trackerHoursWorked : manualHoursWorked,
          overtimeWorked:
            mode === "tracker" ? trackerOvertimeWorked : manualOvertimeWorked,
        },
        calculatedPay: breakdown,
        settingsVersion: settingsService.computeSettingsVersion(
          settings as AppSettings
        ),
        rateSnapshot:
          (settings?.payRates || []).length === 0 ||
          hourlyRateId === "custom" ||
          overtimeRateId === "custom"
            ? {
                base: parseFloat(manualBaseRateText || ""),
                overtime: parseFloat(manualOvertimeRateText || ""),
              }
            : undefined,
        calcSnapshot: {
          usedBase:
            mode === "tracker" ? trackerDerivedSplit?.base : manualHoursWorked,
          usedOvertime:
            mode === "tracker"
              ? trackerDerivedSplit?.overtime
              : manualOvertimeWorked,
          night: Boolean((settings?.payRules?.night as any)?.enabled)
            ? {
                base: trackerNightHint?.base,
                overtime: trackerNightHint?.ot,
                type: settings?.payRules?.night?.type,
                value: settings?.payRules?.night?.value,
              }
            : undefined,
          weekend: Boolean((settings?.payRules?.weekend as any)?.enabled)
            ? {
                mode:
                  (settings?.payRules?.weekend as any)?.mode ||
                  ((settings?.payRules?.weekend as any)?.type === "percentage"
                    ? ("multiplier" as const)
                    : (settings?.payRules?.weekend as any)?.type === "fixed"
                    ? ("fixed" as const)
                    : undefined),
                value:
                  (settings?.payRules as any)?.weekend?.multiplier ??
                  (settings?.payRules as any)?.weekend?.uplift ??
                  (settings?.payRules as any)?.weekend?.value,
              }
            : undefined,
        },
        createdAt: Date.now(),
      };

      await settingsService.savePayCalculation(entry);
      notify.success(
        "Saved",
        `${formatDateDisplay(
          date
        )} • Total ${currencySymbol}${breakdown.total.toFixed(2)}`
      );
      onPaySaved();
    } catch (e) {
      Alert.alert("Error", "Failed to save pay calculation");
    } finally {
      setIsSaving(false);
    }
  };

  const resolveRateValue = (
    id: string | null | undefined
  ): number | undefined => {
    if (!id) return undefined;
    const list = settings?.payRates || [];
    return list.find((r) => r.id === id)?.value;
  };

  const baseRates = (settings?.payRates || []).filter((r) => r.type === "base");
  const overtimeRates = (settings?.payRates || []).filter(
    (r) => r.type === "overtime"
  );

  if (loadingSettings) {
    return (
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Loading…
        </ThemedText>
        <View style={styles.loadingSkeleton}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          <View style={styles.skeletonBlock} />
        </View>
      </View>
    );
  }

  return (
    <ThemedView>
      <DateSelector selectedDate={date} onDateChange={setDate} />

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
            mode === "tracker" && styles.modeButtonActive,
          ]}
          onPress={async () => {
            setMode("tracker");
            // Refresh tracker data when switching to tracker mode
            if (settings) {
              try {
                const hm = await settingsService.deriveTrackerHoursForDate(
                  date
                );
                setTrackerHoursWorked(hm);
                const hasShifts = (hm.hours || 0) > 0 || (hm.minutes || 0) > 0;
                setHasShiftsForDate(hasShifts);
              } catch (error) {
                console.error("Error refreshing tracker data:", error);
              }
            }
          }}
        >
          <ThemedText
            style={[
              styles.modeText,
              mode === "tracker" && styles.modeTextActive,
            ]}
          >
            Tracker
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
            mode === "manual" && styles.modeButtonActive,
          ]}
          onPress={() => setMode("manual")}
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
      </View>

      {/* Rates */}
      <PayRatesInput
        baseRates={baseRates}
        overtimeRates={overtimeRates}
        selectedBaseRateId={hourlyRateId}
        selectedOvertimeRateId={overtimeRateId}
        manualBaseRate={manualBaseRateText}
        manualOvertimeRate={manualOvertimeRateText}
        currencySymbol={currencySymbol}
        onBaseRateChange={setHourlyRateId}
        onOvertimeRateChange={setOvertimeRateId}
        onManualBaseRateChange={onManualBaseRateTextChange}
        onManualOvertimeRateChange={onManualOvertimeRateTextChange}
      />

      {/* Hours */}
      <PayHoursInput
        mode={mode}
        date={date}
        trackerHours={trackerHoursWorked}
        trackerOvertime={trackerOvertimeWorked}
        manualHours={manualHoursWorked}
        manualOvertime={manualOvertimeWorked}
        manualNightBase={manualNightBase}
        manualNightOt={manualNightOt}
        trackerDerivedSplit={trackerDerivedSplit}
        trackerNightHint={trackerNightHint}
        onTrackerHoursChange={setTrackerHoursWorked}
        onTrackerOvertimeChange={setTrackerOvertimeWorked}
        onManualHoursChange={setManualHoursWorked}
        onManualOvertimeChange={setManualOvertimeWorked}
        onManualNightBaseChange={setManualNightBase}
        onManualNightOtChange={setManualNightOt}
      />

      {/* Breakdown */}
      <PayBreakdownCard
        breakdown={breakdown}
        currencySymbol={currencySymbol}
        isSaving={isSaving}
        onSave={handleSave}
        hasShifts={hasShiftsForDate}
        hasPayRates={baseRates.length > 0 || overtimeRates.length > 0}
        hoursWorked={
          mode === "tracker" ? trackerHoursWorked : manualHoursWorked
        }
        overtimeWorked={
          mode === "tracker" ? trackerOvertimeWorked : manualOvertimeWorked
        }
        baseRate={resolveRateValue(hourlyRateId)}
        overtimeRate={resolveRateValue(overtimeRateId)}
      />
    </ThemedView>
  );
};
