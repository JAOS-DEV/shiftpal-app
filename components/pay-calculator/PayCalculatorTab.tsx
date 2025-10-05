import { DateSelector } from "@/components/DateSelector";
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
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { PayBreakdownCard } from "./PayBreakdownCard";
import { PayHoursInput } from "./PayHoursInput";
import { PayRatesInput } from "./PayRatesInput";

type Mode = "tracker" | "manual";

interface PayCalculatorTabProps {
  settings: AppSettings | null;
  loadingSettings: boolean;
  onPaySaved: () => void;
}

export const PayCalculatorTab: React.FC<PayCalculatorTabProps> = ({
  settings,
  loadingSettings,
  onPaySaved,
}) => {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>("tracker");
  const [date, setDate] = useState<string>(getCurrentDateString());
  const [hourlyRateId, setHourlyRateId] = useState<string | null>(null);
  const [overtimeRateId, setOvertimeRateId] = useState<string | null>(null);
  const [manualBaseRateText, setManualBaseRateText] = useState<string>("");
  const [manualOvertimeRateText, setManualOvertimeRateText] = useState<string>("");

  // Tracker mode hours
  const [trackerHoursWorked, setTrackerHoursWorked] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [trackerOvertimeWorked, setTrackerOvertimeWorked] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });

  // Manual mode hours
  const [manualHoursWorked, setManualHoursWorked] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [manualOvertimeWorked, setManualOvertimeWorked] = useState<HoursAndMinutes>({
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

  // Load default rates and tracker hours when mode/date changes
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!settings) return;
      const base = settings.payRates.find((r) => r.type === "base");
      const ot = settings.payRates.find((r) => r.type === "overtime") || base;
      setHourlyRateId(base?.id ?? null);
      setOvertimeRateId(ot?.id ?? null);

      if (mode === "tracker") {
        const hm = await settingsService.deriveTrackerHoursForDate(date);
        setTrackerHoursWorked(hm);
      }
    };
    void load();
  }, [mode, date, settings]);

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

    // Manual override if needed
    const savedBase = resolveRateValue(hourlyRateId);
    const savedOt = resolveRateValue(overtimeRateId) ?? savedBase;
    const manualBase = parseFloat(manualBaseRateText || "");
    const manualOt = parseFloat(manualOvertimeRateText || "");
    const needManual =
      !Number.isFinite(savedBase as number) ||
      !Number.isFinite(savedOt as number);

    if (needManual) {
      const safeBase = Number.isFinite(savedBase as number)
        ? (savedBase as number)
        : Number.isFinite(manualBase)
        ? manualBase
        : 0;
      const safeOt = Number.isFinite(savedOt as number)
        ? (savedOt as number)
        : Number.isFinite(manualOt)
        ? manualOt
        : safeBase;

      const baseHours = Math.max(
        0,
        ((hoursWorked.hours || 0) + (hoursWorked.minutes || 0) / 60)
      );
      const otHours = Math.max(
        0,
        ((overtimeWorked.hours || 0) + (overtimeWorked.minutes || 0) / 60)
      );

      const basePay = safeBase * baseHours;
      const otPay = safeOt * otHours;
      const gross = basePay + otPay;
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
          (settings?.payRates || []).length === 0
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

  const resolveRateValue = (id: string | null | undefined): number | undefined => {
    if (!id) return undefined;
    const list = settings?.payRates || [];
    return list.find((r) => r.id === id)?.value;
  };

  const baseRates = (settings?.payRates || []).filter(
    (r) => r.type === "base" || r.type === "premium"
  );
  const overtimeRates = (settings?.payRates || []).filter(
    (r) => r.type === "overtime" || r.type === "premium"
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
          onPress={() => setMode("tracker")}
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
            style={[styles.modeText, mode === "manual" && styles.modeTextActive]}
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
        onManualBaseRateChange={setManualBaseRateText}
        onManualOvertimeRateChange={setManualOvertimeRateText}
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
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "white",
  },
  cardTitle: {
    marginBottom: 12,
  },
  loadingSkeleton: {
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: "#EDEDED",
    borderRadius: 8,
  },
  skeletonLineShort: {
    width: "70%",
  },
  skeletonBlock: {
    height: 120,
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    marginTop: 8,
  },
  modeRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
  },
  modeButtonActive: {
    backgroundColor: "#007AFF",
  },
  modeText: {
    fontWeight: "600",
    color: "#8E8E93",
  },
  modeTextActive: {
    color: "white",
  },
});

