import { DateSelector } from "@/components/tracker/DateSelector";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { shiftService } from "@/services/shiftService";
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
import { Alert, Platform, View } from "react-native";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
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
  const [mode, setMode] = useState<Mode>("manual"); // Always manual mode for UI
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

  // Store calculated hours for display
  const [calculatedHoursWorked, setCalculatedHoursWorked] =
    useState<HoursAndMinutes>({ hours: 0, minutes: 0 });
  const [calculatedOvertimeWorked, setCalculatedOvertimeWorked] =
    useState<HoursAndMinutes>({ hours: 0, minutes: 0 });

  // State for tracking shifts and pay rates for warnings
  const [hasShiftsForDate, setHasShiftsForDate] = useState(false);
  const [hasExistingCalculation, setHasExistingCalculation] = useState(false);
  const [isOverrideMode, setIsOverrideMode] = useState(false);

  // State for Load from Tracker functionality
  const [hasSubmittedShifts, setHasSubmittedShifts] = useState(false);
  const [isLoadingTrackerHours, setIsLoadingTrackerHours] = useState(false);
  const [hasLoadedFromTracker, setHasLoadedFromTracker] = useState(false);

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
  const taxEnabled = settings?.payRules?.tax?.enabled === true;
  const niEnabled = settings?.payRules?.ni?.enabled === true;

  // Reset component state when user changes (logout/login)
  useEffect(() => {
    // Reset all state to initial values when user changes
    setMode("manual");
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

  // Load default rates when settings change
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
        // Switching to custom - clear manual rate text so warning shows
        setHourlyRateId("custom");
        if (savedBaseRateId && savedBaseRateId !== "custom") {
          // Had a saved rate that was deleted - clear manual text
          onManualBaseRateTextChange("");
        }
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
        // Switching to custom - clear manual rate text so warning shows
        setOvertimeRateId("custom");
        if (savedOvertimeRateId && savedOvertimeRateId !== "custom") {
          // Had a saved rate that was deleted - clear manual text
          onManualOvertimeRateTextChange("");
        }
      }
    };
    void load();
  }, [settings, onManualBaseRateTextChange, onManualOvertimeRateTextChange]);

  // Check for existing calculations whenever date changes
  useEffect(() => {
    const checkExistingCalculation = async (): Promise<void> => {
      if (!settings) return;

      try {
        const hasCalculation = await settingsService.hasPayCalculationForDate(
          date
        );
        setHasExistingCalculation(hasCalculation);
      } catch (error) {
        console.error("Error checking existing calculation:", error);
      }
    };

    void checkExistingCalculation();
  }, [date, settings]);

  // Check for submitted shifts whenever date changes
  useEffect(() => {
    const checkSubmittedShifts = async (): Promise<void> => {
      try {
        const submittedDays = await shiftService.getSubmittedDays({
          type: "all",
        });
        const dayForDate = submittedDays.find((d) => d.date === date);
        const hasShifts =
          dayForDate &&
          dayForDate.submissions &&
          dayForDate.submissions.length > 0;
        setHasSubmittedShifts(!!hasShifts);
      } catch (error) {
        console.error("Error checking submitted shifts:", error);
        setHasSubmittedShifts(false);
      }
    };

    void checkSubmittedShifts();
  }, [date]);

  // Reset loaded from tracker flag when date changes
  useEffect(() => {
    setHasLoadedFromTracker(false);
  }, [date]);

  // Load persisted manual inputs for the current date
  useEffect(() => {
    const loadPersistedInputs = async (): Promise<void> => {
      try {
        const key = `pay_calc_manual_inputs.${date}`;
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          setManualHoursWorked(parsed.hoursWorked || { hours: 0, minutes: 0 });
          setManualOvertimeWorked(
            parsed.overtimeWorked || { hours: 0, minutes: 0 }
          );
          setManualNightBase(parsed.nightBase || { hours: 0, minutes: 0 });
          setManualNightOt(parsed.nightOt || { hours: 0, minutes: 0 });
        } else {
          // Reset to zeros if no persisted data
          setManualHoursWorked({ hours: 0, minutes: 0 });
          setManualOvertimeWorked({ hours: 0, minutes: 0 });
          setManualNightBase({ hours: 0, minutes: 0 });
          setManualNightOt({ hours: 0, minutes: 0 });
        }
      } catch (error) {
        console.error("Error loading persisted inputs:", error);
      }
    };

    void loadPersistedInputs();
  }, [date]);

  // Persist manual inputs whenever they change
  useEffect(() => {
    const persistInputs = async (): Promise<void> => {
      try {
        const key = `pay_calc_manual_inputs.${date}`;
        const data = {
          hoursWorked: manualHoursWorked,
          overtimeWorked: manualOvertimeWorked,
          nightBase: manualNightBase,
          nightOt: manualNightOt,
        };
        await AsyncStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error("Error persisting inputs:", error);
      }
    };

    void persistInputs();
  }, [
    date,
    manualHoursWorked,
    manualOvertimeWorked,
    manualNightBase,
    manualNightOt,
  ]);

  // Refresh submitted shifts check when screen is focused
  useEffect(() => {
    const refreshSubmittedShifts = async (): Promise<void> => {
      if (!isFocused) return;

      try {
        const submittedDays = await shiftService.getSubmittedDays({
          type: "all",
        });
        const dayForDate = submittedDays.find((d) => d.date === date);
        const hasShifts =
          dayForDate &&
          dayForDate.submissions &&
          dayForDate.submissions.length > 0;
        setHasSubmittedShifts(!!hasShifts);
      } catch (error) {
        console.error("Error refreshing submitted shifts:", error);
      }
    };

    void refreshSubmittedShifts();
  }, [isFocused, date]);

  // Recalculate pay whenever inputs change
  const recalc = async (): Promise<void> => {
    if (!settings) return;

    let nightBaseHours: HoursAndMinutes | undefined;
    let nightOvertimeHours: HoursAndMinutes | undefined;
    let derivedSplit: {
      base: HoursAndMinutes;
      overtime: HoursAndMinutes;
    } | null = null;

    // Always use manual night hours (since we always show manual input fields)
    nightBaseHours = manualNightBase;
    nightOvertimeHours = manualNightOt;

    // Always use manual hours for calculation (since UI always shows manual inputs)
    let hoursWorked: HoursAndMinutes = manualHoursWorked;
    let overtimeWorked: HoursAndMinutes = manualOvertimeWorked;

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
        taxEnabled && typeof settings?.payRules?.tax?.percentage === "number"
          ? settings.payRules.tax.percentage
          : 0;
      const niPct =
        niEnabled && typeof settings?.payRules?.ni?.percentage === "number"
          ? settings.payRules.ni.percentage
          : 0;
      const tax = taxEnabled ? (taxPct / 100) * gross : 0;
      const ni = niEnabled ? (niPct / 100) * gross : 0;
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

    // Store calculated hours for display
    setCalculatedHoursWorked(hoursWorked);
    setCalculatedOvertimeWorked(overtimeWorked);
  };

  useEffect(() => {
    void recalc();
  }, [
    settings,
    mode,
    date,
    hourlyRateId,
    overtimeRateId,
    manualHoursWorked,
    manualOvertimeWorked,
    manualNightBase,
    manualNightOt,
    manualBaseRateText,
    manualOvertimeRateText,
  ]);

  const handleSave = async (): Promise<void> => {
    if (!breakdown) return;

    // Check if hours are entered
    const totalMinutes =
      (manualHoursWorked.hours || 0) * 60 +
      (manualHoursWorked.minutes || 0) +
      (manualOvertimeWorked.hours || 0) * 60 +
      (manualOvertimeWorked.minutes || 0);

    if (totalMinutes === 0) {
      notify.warn(
        "No hours entered",
        "Please enter hours worked before saving."
      );
      return;
    }

    // Check if rates are configured
    if (!hourlyRateId && !manualBaseRateText) {
      Alert.alert(
        "Rate required",
        "Please select a base rate in Settings or enter a manual base rate."
      );
      return;
    }

    // Validate that rates have actual values
    const baseRate = hourlyRateId
      ? resolveRateValue(hourlyRateId)
      : parseFloat(manualBaseRateText || "");
    const overtimeRate = overtimeRateId
      ? resolveRateValue(overtimeRateId)
      : parseFloat(manualOvertimeRateText || "") || baseRate;

    if (!baseRate || baseRate <= 0) {
      notify.warn(
        "Invalid rate",
        "Please enter a valid base rate greater than 0."
      );
      return;
    }

    // Check if total pay is £0 (shouldn't happen if rates are valid, but safety check)
    if (breakdown.total <= 0) {
      notify.warn(
        "£0 calculation",
        "Cannot save a pay calculation with £0 total."
      );
      return;
    }

    // Check if pay has already been calculated for this date
    if (hasExistingCalculation) {
      notify.warn(
        `Pay already saved (${formatDateDisplay(date)})`,
        "Delete the existing calculation first."
      );
      return;
    }

    setIsSaving(true);
    try {
      const entry: PayCalculationEntry = {
        id: Date.now().toString(36),
        input: {
          mode: hasLoadedFromTracker ? "tracker" : "manual", // Track origin
          date,
          hourlyRateId,
          overtimeRateId,
          hoursWorked: manualHoursWorked, // Always use manual (UI shows manual inputs)
          overtimeWorked: manualOvertimeWorked,
        },
        calculatedPay: breakdown,
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
          usedBase: manualHoursWorked, // Always use manual
          usedOvertime: manualOvertimeWorked,
          night: Boolean((settings?.payRules?.night as any)?.enabled)
            ? {
                base: manualNightBase,
                overtime: manualNightOt,
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

      // Update the existing calculation state immediately
      setHasExistingCalculation(true);

      notify.success(
        "Saved",
        `${formatDateDisplay(
          date
        )} • Total ${currencySymbol}${breakdown.total.toFixed(2)}`
      );
      onPaySaved();

      // Clear hour inputs after successful save
      setManualHoursWorked({ hours: 0, minutes: 0 });
      setManualOvertimeWorked({ hours: 0, minutes: 0 });
      setManualNightBase({ hours: 0, minutes: 0 });
      setManualNightOt({ hours: 0, minutes: 0 });
      setHasLoadedFromTracker(false);

      // Also clear persisted inputs for this date
      try {
        const key = `pay_calc_manual_inputs.${date}`;
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error("Error clearing persisted inputs:", error);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("already exists")) {
        notify.warn(
          `Pay already saved (${formatDateDisplay(date)})`,
          "Delete the existing calculation first."
        );
      } else {
        notify.error("Error", "Failed to save pay calculation");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFromTracker = async (): Promise<void> => {
    if (!settings || !hasSubmittedShifts) return;

    // If pay already exists, confirm replacement
    if (hasExistingCalculation) {
      const confirmReplace =
        Platform.OS === "web"
          ? window.confirm(
              "Replace existing calculation with current tracker hours?"
            )
          : await new Promise<boolean>((resolve) => {
              Alert.alert(
                "Replace Calculation",
                "This will replace your existing pay calculation with current tracker hours. Continue?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => resolve(false),
                  },
                  {
                    text: "Replace",
                    style: "destructive",
                    onPress: () => resolve(true),
                  },
                ]
              );
            });

      if (!confirmReplace) return;

      // Delete existing calculation first
      try {
        const existingEntries = await settingsService.getPayHistory();
        const entryToDelete = existingEntries.find(
          (e) => e.input.date === date
        );
        if (entryToDelete) {
          await settingsService.deletePayCalculation(entryToDelete.id);
          setHasExistingCalculation(false);
        }
      } catch (error) {
        console.error("Error deleting existing calculation:", error);
        notify.error("Error", "Failed to delete existing calculation");
        return;
      }
    }

    setIsLoadingTrackerHours(true);
    try {
      // Fetch hours from tracker
      const hm = await settingsService.deriveTrackerHoursForDate(date);

      // All hours are base hours (no overtime split)
      const baseHours = hm;
      const overtimeHours: HoursAndMinutes = { hours: 0, minutes: 0 };

      // Fetch night allocation if night rules are configured
      let nightBase: HoursAndMinutes = { hours: 0, minutes: 0 };
      let nightOt: HoursAndMinutes = { hours: 0, minutes: 0 };

      if (settings?.payRules?.night?.enabled) {
        try {
          const alloc =
            await settingsService.deriveTrackerNightAllocationForDate(
              date,
              settings
            );
          nightBase = alloc.nightBase || { hours: 0, minutes: 0 };
          nightOt = alloc.nightOvertime || { hours: 0, minutes: 0 };
        } catch (error) {
          console.error("Error deriving night allocation:", error);
        }
      }

      // Populate manual input fields
      setManualHoursWorked(baseHours);
      setManualOvertimeWorked(overtimeHours);
      setManualNightBase(nightBase);
      setManualNightOt(nightOt);

      // Track that data came from tracker (but keep mode as "manual" for UI)
      setHasLoadedFromTracker(true);

      notify.success("Loaded", "Hours loaded from tracker");
    } catch (error) {
      console.error("Error loading from tracker:", error);
      notify.error("Error", "Failed to load hours from tracker");
    } finally {
      setIsLoadingTrackerHours(false);
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

  // Check if night rules are configured
  const hasNightRules = useMemo(() => {
    return settings?.payRules?.night?.enabled === true;
  }, [settings?.payRules?.night]);

  // Determine if save should be disabled
  const { isSaveDisabled, disabledReason } = useMemo(() => {
    // Check if hours are entered
    const totalMinutes =
      (manualHoursWorked.hours || 0) * 60 +
      (manualHoursWorked.minutes || 0) +
      (manualOvertimeWorked.hours || 0) * 60 +
      (manualOvertimeWorked.minutes || 0);

    if (totalMinutes === 0) {
      return { isSaveDisabled: true, disabledReason: "Enter hours to save" };
    }

    // Check if rates are configured
    const baseRate = hourlyRateId
      ? resolveRateValue(hourlyRateId)
      : parseFloat(manualBaseRateText || "");

    if (!baseRate || baseRate <= 0) {
      return {
        isSaveDisabled: true,
        disabledReason: "Set a valid pay rate to save",
      };
    }

    // Check if total is £0
    if (breakdown && breakdown.total <= 0) {
      return {
        isSaveDisabled: true,
        disabledReason: "Total must be greater than £0",
      };
    }

    return { isSaveDisabled: false, disabledReason: undefined };
  }, [
    manualHoursWorked,
    manualOvertimeWorked,
    hourlyRateId,
    manualBaseRateText,
    breakdown,
  ]);

  if (loadingSettings) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Loading…
        </ThemedText>
        <View style={styles.loadingSkeleton}>
          <View
            style={[styles.skeletonLine, { backgroundColor: colors.card }]}
          />
          <View
            style={[
              styles.skeletonLine,
              styles.skeletonLineShort,
              { backgroundColor: colors.card },
            ]}
          />
          <View
            style={[styles.skeletonBlock, { backgroundColor: colors.card }]}
          />
        </View>
      </View>
    );
  }

  return (
    <ThemedView>
      <DateSelector selectedDate={date} onDateChange={setDate} />

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
        hoursWorked={manualHoursWorked}
        overtimeWorked={manualOvertimeWorked}
        hasShifts={hasSubmittedShifts}
        hasPayRates={baseRates.length > 0 || overtimeRates.length > 0}
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
        isOverrideMode={isOverrideMode}
        onToggleOverride={() => setIsOverrideMode(!isOverrideMode)}
        onResetOverride={() => {
          setIsOverrideMode(false);
          // Reset tracker hours to auto-calculated values
          if (trackerDerivedSplit) {
            setTrackerHoursWorked(trackerDerivedSplit.base);
            setTrackerOvertimeWorked(trackerDerivedSplit.overtime);
          }
        }}
        hasSubmittedShifts={hasSubmittedShifts}
        isLoadingTrackerHours={isLoadingTrackerHours}
        hasLoadedFromTracker={hasLoadedFromTracker}
        onLoadFromTracker={handleLoadFromTracker}
        hasNightRules={hasNightRules}
        hasExistingCalculation={hasExistingCalculation}
      />

      {/* Breakdown */}
      <PayBreakdownCard
        breakdown={breakdown}
        currencySymbol={currencySymbol}
        isSaving={isSaving}
        onSave={handleSave}
        hasShifts={hasSubmittedShifts}
        hasPayRates={baseRates.length > 0 || overtimeRates.length > 0}
        hoursWorked={calculatedHoursWorked}
        overtimeWorked={calculatedOvertimeWorked}
        baseRate={resolveRateValue(hourlyRateId)}
        overtimeRate={resolveRateValue(overtimeRateId)}
        allowanceItems={settings?.payRules?.allowances || []}
        totalHours={
          manualHoursWorked.hours +
          manualHoursWorked.minutes / 60 +
          manualOvertimeWorked.hours +
          manualOvertimeWorked.minutes / 60
        }
        isDisabled={isSaveDisabled}
        disabledReason={disabledReason}
        taxEnabled={taxEnabled}
        niEnabled={niEnabled}
      />
    </ThemedView>
  );
};
