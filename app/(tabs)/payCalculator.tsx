import { DateSelector } from "@/components/DateSelector";
import { Dropdown } from "@/components/Dropdown";
import { SegmentedSwitcher } from "@/components/SegmentedSwitcher";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import {
  AppSettings,
  HoursAndMinutes,
  PayBreakdown,
  PayCalculationEntry,
  PayCalculationInput,
} from "@/types/settings";
import { formatDateDisplay, getCurrentDateString } from "@/utils/timeUtils";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type Mode = "tracker" | "manual";
type TopTab = "calculator" | "history";
type PeriodFilter = "week" | "month" | "all";

export default function PayCalculatorScreen() {
  const { colors } = useTheme();
  const [topTab, setTopTab] = useState<TopTab>("calculator");
  const [mode, setMode] = useState<Mode>("tracker");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [date, setDate] = useState<string>(getCurrentDateString());
  const [hourlyRateId, setHourlyRateId] = useState<string | null>(null);
  const [overtimeRateId, setOvertimeRateId] = useState<string | null>(null);
  const [manualBaseRateText, setManualBaseRateText] = useState<string>("");
  const [manualOvertimeRateText, setManualOvertimeRateText] =
    useState<string>("");
  // Separate hours state per mode to avoid bleed when switching
  const [trackerHoursWorked, setTrackerHoursWorked] = useState<HoursAndMinutes>(
    { hours: 0, minutes: 0 }
  );
  const [trackerOvertimeWorked, setTrackerOvertimeWorked] =
    useState<HoursAndMinutes>({ hours: 0, minutes: 0 });
  const [manualHoursWorked, setManualHoursWorked] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [manualOvertimeWorked, setManualOvertimeWorked] =
    useState<HoursAndMinutes>({ hours: 0, minutes: 0 });
  // Manual night allocation (optional)
  const [manualNightBase, setManualNightBase] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [manualNightOt, setManualNightOt] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  // Local text state for numeric hour/minute fields to prevent iOS flicker
  const [workedHoursText, setWorkedHoursText] = useState<string>("");
  const [workedMinutesText, setWorkedMinutesText] = useState<string>("");
  const [otHoursText, setOtHoursText] = useState<string>("");
  const [otMinutesText, setOtMinutesText] = useState<string>("");
  const [nightBaseHoursText, setNightBaseHoursText] = useState<string>("");
  const [nightBaseMinutesText, setNightBaseMinutesText] = useState<string>("");
  const [nightOtHoursText, setNightOtHoursText] = useState<string>("");
  const [nightOtMinutesText, setNightOtMinutesText] = useState<string>("");
  const [breakdown, setBreakdown] = useState<PayBreakdown | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [payHistory, setPayHistory] = useState<PayCalculationEntry[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("week");
  const [settingsVersion, setSettingsVersion] = useState<string>("");
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [pendingUndo, setPendingUndo] = useState<{
    ids: string[];
    prev: PayCalculationEntry[];
  } | null>(null);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );

  useEffect(() => {
    const load = async () => {
      if (!isFocused) return;
      const s = await settingsService.getSettings();
      setSettings(s);
      const base = s.payRates.find((r) => r.type === "base");
      const ot = s.payRates.find((r) => r.type === "overtime") || base;
      setHourlyRateId(base?.id ?? null);
      setOvertimeRateId(ot?.id ?? null);
      if (mode === "tracker") {
        const hm = await settingsService.deriveTrackerHoursForDate(date);
        setTrackerHoursWorked(hm);
        // preserve previously entered tracker overtime; do not reset
      }
    };
    load();
    // Subscribe to live settings changes (e.g., when modified in Settings screen)
    const unsub = settingsService.subscribe((next) => {
      setSettings(next);
      // Keep selected rate ids if still present; otherwise pick sensible defaults
      const base = next.payRates.find((r) => r.type === "base");
      const ot = next.payRates.find((r) => r.type === "overtime") || base;
      setHourlyRateId((prev) =>
        next.payRates.some((r) => r.id === prev) ? prev : base?.id ?? null
      );
      setOvertimeRateId((prev) =>
        next.payRates.some((r) => r.id === prev) ? prev : ot?.id ?? null
      );
      // Update current version so history can immediately reflect staleness
      try {
        setCurrentVersion(settingsService.computeSettingsVersion(next));
      } catch {}
    });
    return () => unsub();
  }, [mode, date, isFocused]);

  // Load pay history when History tab is active
  useEffect(() => {
    const loadHistory = async () => {
      if (topTab !== "history" || !isFocused) return;
      const list = await settingsService.getPayHistory();
      setPayHistory(list);
      const v = await settingsService.getHistorySettingsVersion();
      setCurrentVersion(v);
      // Determine the latest version seen in history items (fallback "")
      const seen = list.find((e) => e.settingsVersion)?.settingsVersion || "";
      setSettingsVersion(seen);
    };
    void loadHistory();
  }, [topTab, isFocused]);

  const recalc = async () => {
    if (!settings) return;
    // Derive night allocation per mode
    let nightBaseHours: HoursAndMinutes | undefined;
    let nightOvertimeHours: HoursAndMinutes | undefined;
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

    const input: PayCalculationInput = {
      mode,
      date,
      hourlyRateId,
      overtimeRateId,
      hoursWorked: mode === "tracker" ? trackerHoursWorked : manualHoursWorked,
      overtimeWorked:
        mode === "tracker" ? trackerOvertimeWorked : manualOvertimeWorked,
      nightBaseHours,
      nightOvertimeHours,
    };
    let result = settingsService.computePay(input, settings);
    // Manual override if needed: if a saved base or overtime rate is missing,
    // use the manual text fields for the missing pieces (no toggle required)
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
        ((mode === "tracker"
          ? trackerHoursWorked.hours
          : manualHoursWorked.hours) || 0) +
          ((mode === "tracker"
            ? trackerHoursWorked.minutes
            : manualHoursWorked.minutes) || 0) /
            60
      );
      const otHours = Math.max(
        0,
        ((mode === "tracker"
          ? trackerOvertimeWorked.hours
          : manualOvertimeWorked.hours) || 0) +
          ((mode === "tracker"
            ? trackerOvertimeWorked.minutes
            : manualOvertimeWorked.minutes) || 0) /
            60
      );
      const basePay = safeBase * baseHours;
      const otPay = safeOt * otHours;
      const gross = basePay + otPay; // ignore uplifts/allowances in manual path
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
    // else keep computed result
    setBreakdown(result);
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
    isFocused,
    manualBaseRateText,
    manualOvertimeRateText,
  ]);

  // Sync text inputs when the active mode's numeric hour state changes
  useEffect(() => {
    const current = mode === "tracker" ? trackerHoursWorked : manualHoursWorked;
    const h = Math.max(0, current.hours ?? 0);
    const m = Math.max(0, current.minutes ?? 0);
    setWorkedHoursText(h === 0 ? "" : String(h));
    setWorkedMinutesText(m === 0 ? "" : String(m));
  }, [mode, trackerHoursWorked, manualHoursWorked]);

  useEffect(() => {
    const current =
      mode === "tracker" ? trackerOvertimeWorked : manualOvertimeWorked;
    const h = Math.max(0, current.hours ?? 0);
    const m = Math.max(0, current.minutes ?? 0);
    setOtHoursText(h === 0 ? "" : String(h));
    setOtMinutesText(m === 0 ? "" : String(m));
  }, [mode, trackerOvertimeWorked, manualOvertimeWorked]);

  const handleSave = async () => {
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
        createdAt: Date.now(),
      };
      await settingsService.savePayCalculation(entry);
      // Optimistically prepend to local history so History tab reflects immediately
      setPayHistory((prev) => [entry, ...prev]);
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: `${formatDateDisplay(
          date
        )} • Total ${currencySymbol}${breakdown.total.toFixed(2)}`,
        position: "bottom",
      });
    } catch (e) {
      Alert.alert("Error", "Failed to save pay calculation");
    } finally {
      setIsSaving(false);
    }
  };

  const parseNumber = (t: string) => {
    const n = parseInt(t || "0", 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  };

  const clampMinutes = (n: number) => {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(59, Math.floor(n)));
  };

  const clampHours = (n: number) => {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(24, Math.floor(n)));
  };

  const baseRates = (settings?.payRates || []).filter(
    (r) => r.type === "base" || r.type === "premium"
  );
  const overtimeRates = (settings?.payRates || []).filter(
    (r) => r.type === "overtime" || r.type === "premium"
  );

  // Removed tap-to-cycle helper; Dropdowns used instead

  const resolveRateLabel = (id: string | null | undefined) => {
    if (!id) return undefined;
    const list = settings?.payRates || [];
    return list.find((r) => r.id === id)?.label;
  };

  const resolveRateValue = (id: string | null | undefined) => {
    if (!id) return undefined;
    const list = settings?.payRates || [];
    return list.find((r) => r.id === id)?.value;
  };

  const hmToMinutes = (hm: HoursAndMinutes | undefined | null) => {
    const h = Math.max(0, hm?.hours ?? 0);
    const m = Math.max(0, hm?.minutes ?? 0);
    return h * 60 + m;
  };

  const minutesToHMText = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const formatHMClock = (hm: HoursAndMinutes) => {
    const h = Math.max(0, hm.hours || 0);
    const m = Math.max(0, hm.minutes || 0);
    return `${h}:${String(m).padStart(2, "0")}`;
  };

  const formatTimeOfDay = (ts: number) => {
    try {
      const d = new Date(ts);
      const is24 = settings?.preferences?.timeFormat !== "12h";
      if (is24) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const isInCurrentWeek = (ts: number) => {
    const d = new Date(ts);
    const now = startOfToday();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return d >= monday && d <= sunday;
  };

  const isInCurrentMonth = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  };

  const filteredHistory = useMemo(() => {
    if (period === "all") return payHistory;
    if (period === "week")
      return payHistory.filter((e) => isInCurrentWeek(e.createdAt));
    return payHistory.filter((e) => isInCurrentMonth(e.createdAt));
  }, [payHistory, period]);

  const summary = useMemo(() => {
    const totals = filteredHistory.reduce(
      (acc, e) => {
        acc.base += e.calculatedPay.base;
        acc.overtime += e.calculatedPay.overtime;
        acc.uplifts += e.calculatedPay.uplifts;
        acc.allowances += e.calculatedPay.allowances;
        acc.gross +=
          e.calculatedPay.gross ??
          e.calculatedPay.base +
            e.calculatedPay.overtime +
            e.calculatedPay.uplifts +
            e.calculatedPay.allowances;
        acc.tax += e.calculatedPay.tax ?? 0;
        acc.ni += e.calculatedPay.ni ?? 0;
        acc.total += e.calculatedPay.total;
        acc.minutes +=
          hmToMinutes(e.input.hoursWorked) +
          hmToMinutes(e.input.overtimeWorked);
        return acc;
      },
      {
        base: 0,
        overtime: 0,
        uplifts: 0,
        allowances: 0,
        gross: 0,
        tax: 0,
        ni: 0,
        total: 0,
        minutes: 0,
      }
    );
    return totals;
  }, [filteredHistory]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, PayCalculationEntry[]>();
    for (const entry of filteredHistory) {
      const key = entry.input.date;
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }
    const sorted = Array.from(map.entries()).sort((a, b) =>
      a[0] < b[0] ? 1 : -1
    );
    return sorted;
  }, [filteredHistory]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasStaleEntry = (entry: PayCalculationEntry) =>
    // If an entry has a version and it differs from current, it's stale
    (!!entry.settingsVersion &&
      !!currentVersion &&
      entry.settingsVersion !== currentVersion) ||
    // If there is a current version but the entry predates versioning
    (!entry.settingsVersion && !!currentVersion);

  const getStaleCounts = (entries: PayCalculationEntry[]) => {
    let stale = 0;
    for (const e of entries) if (hasStaleEntry(e)) stale++;
    return { stale, total: entries.length };
  };

  const handleRecalcEntry = async (entry: PayCalculationEntry) => {
    const before = entry;
    const next = await settingsService.recomputeEntry(entry);
    await settingsService.updateHistoryEntry(next);
    // Reload from storage to avoid any local state drift
    const fresh = await settingsService.getPayHistory();
    setPayHistory(fresh);
    try {
      const v = await settingsService.getHistorySettingsVersion();
      setCurrentVersion(v);
    } catch {}
    setPendingUndo({ ids: [entry.id], prev: [before] });
    Toast.show({
      type: "success",
      text1: "Recalculated",
      text2: "Entry updated • Undo available",
      position: "bottom",
    });
  };

  const handleRecalcBulk = async (ids: string[]) => {
    const snapshot = payHistory.filter((e) => ids.includes(e.id));
    const updated = await settingsService.recomputeMany(ids);
    // Reload from storage to avoid any local state drift
    const fresh = await settingsService.getPayHistory();
    setPayHistory(fresh);
    try {
      const v = await settingsService.getHistorySettingsVersion();
      setCurrentVersion(v);
    } catch {}
    setPendingUndo({ ids, prev: snapshot });
    Toast.show({
      type: "success",
      text1: "Recalculated",
      text2: `${updated.length} entr${
        updated.length === 1 ? "y" : "ies"
      } updated • Undo available`,
      position: "bottom",
    });
  };

  const handleUndo = async () => {
    if (!pendingUndo) return;
    const { prev } = pendingUndo;
    for (const entry of prev) {
      await settingsService.updateHistoryEntry(entry);
    }
    const fresh = await settingsService.getPayHistory();
    setPayHistory(fresh);
    setPendingUndo(null);
    Toast.show({ type: "info", text1: "Undone", position: "bottom" });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        {/* Top tab: Calculator | History */}
        <View style={Platform.OS === "web" ? styles.webMaxWidth : undefined}>
          <SegmentedSwitcher
            items={[
              { id: "calculator", label: "Calculator" },
              { id: "history", label: "History" },
            ]}
            activeId={topTab}
            onChange={(id) => setTopTab(id as TopTab)}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60,
            ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={Platform.OS === "web" ? styles.webMaxWidth : undefined}>
            {topTab === "calculator" ? (
              <>
                <DateSelector selectedDate={date} onDateChange={setDate} />

                {/* Inner mode toggle: Tracker | Manual (match Home style) */}
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      Platform.OS === "web"
                        ? ({ cursor: "pointer" } as any)
                        : null,
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
                      Platform.OS === "web"
                        ? ({ cursor: "pointer" } as any)
                        : null,
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
                <View style={styles.card}>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    Rates
                  </ThemedText>
                  {baseRates.length > 0 || overtimeRates.length > 0 ? (
                    <View style={styles.rateInputs}>
                      {baseRates.length > 0 ? (
                        <View style={{ flex: 1 }}>
                          <Dropdown
                            compact
                            placeholder="Select base rate"
                            value={hourlyRateId}
                            onChange={setHourlyRateId as (v: string) => void}
                            items={baseRates.map((r) => ({
                              value: r.id,
                              label: r.label,
                            }))}
                          />
                        </View>
                      ) : (
                        <TextInput
                          style={[styles.rateInput, { flex: 1 }]}
                          keyboardType={
                            Platform.OS === "web" ? "default" : "decimal-pad"
                          }
                          placeholder={`${currencySymbol} base / hr`}
                          placeholderTextColor="#6B7280"
                          selectionColor="#007AFF"
                          value={manualBaseRateText}
                          onChangeText={setManualBaseRateText}
                        />
                      )}

                      {overtimeRates.length > 0 ? (
                        <View style={{ flex: 1 }}>
                          <Dropdown
                            compact
                            placeholder="Select overtime rate"
                            value={overtimeRateId}
                            onChange={setOvertimeRateId as (v: string) => void}
                            items={overtimeRates.map((r) => ({
                              value: r.id,
                              label: r.label,
                            }))}
                          />
                        </View>
                      ) : (
                        <TextInput
                          style={[styles.rateInput, { flex: 1 }]}
                          keyboardType={
                            Platform.OS === "web" ? "default" : "decimal-pad"
                          }
                          placeholder={`${currencySymbol} overtime / hr (optional)`}
                          placeholderTextColor="#6B7280"
                          selectionColor="#007AFF"
                          value={manualOvertimeRateText}
                          onChangeText={setManualOvertimeRateText}
                        />
                      )}
                    </View>
                  ) : (
                    <View style={styles.rateInputs}>
                      <TextInput
                        style={[styles.rateInput, { flex: 1 }]}
                        keyboardType={
                          Platform.OS === "web" ? "default" : "decimal-pad"
                        }
                        placeholder={`${currencySymbol} base / hr`}
                        placeholderTextColor="#6B7280"
                        value={manualBaseRateText}
                        onChangeText={setManualBaseRateText}
                      />
                      <TextInput
                        style={[styles.rateInput, { flex: 1 }]}
                        keyboardType={
                          Platform.OS === "web" ? "default" : "decimal-pad"
                        }
                        placeholder={`${currencySymbol} overtime / hr (optional)`}
                        placeholderTextColor="#6B7280"
                        value={manualOvertimeRateText}
                        onChangeText={setManualOvertimeRateText}
                      />
                    </View>
                  )}
                </View>

                {/* Hours */}
                <View style={styles.card}>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    Hours
                  </ThemedText>
                  <View style={styles.row}>
                    <ThemedText style={styles.rowLabel}>Worked</ThemedText>
                    <View style={styles.inline}>
                      <TextInput
                        style={styles.numInput}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={workedHoursText}
                        onChangeText={setWorkedHoursText}
                        onEndEditing={() =>
                          (mode === "tracker"
                            ? setTrackerHoursWorked
                            : setManualHoursWorked)((p) => ({
                            ...p,
                            hours: clampHours(parseNumber(workedHoursText)),
                          }))
                        }
                      />
                      <ThemedText>h</ThemedText>
                      <TextInput
                        style={styles.numInput}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={workedMinutesText}
                        onChangeText={setWorkedMinutesText}
                        onEndEditing={() =>
                          (mode === "tracker"
                            ? setTrackerHoursWorked
                            : setManualHoursWorked)((p) => ({
                            ...p,
                            minutes: clampMinutes(
                              parseNumber(workedMinutesText)
                            ),
                          }))
                        }
                      />
                      <ThemedText>m</ThemedText>
                    </View>
                  </View>
                  <View style={styles.row}>
                    <ThemedText style={styles.rowLabel}>Overtime</ThemedText>
                    <View style={styles.inline}>
                      <TextInput
                        style={styles.numInput}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={otHoursText}
                        onChangeText={setOtHoursText}
                        onEndEditing={() =>
                          (mode === "tracker"
                            ? setTrackerOvertimeWorked
                            : setManualOvertimeWorked)((p) => ({
                            ...p,
                            hours: clampHours(parseNumber(otHoursText)),
                          }))
                        }
                      />
                      <ThemedText>h</ThemedText>
                      <TextInput
                        style={styles.numInput}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={otMinutesText}
                        onChangeText={setOtMinutesText}
                        onEndEditing={() =>
                          (mode === "tracker"
                            ? setTrackerOvertimeWorked
                            : setManualOvertimeWorked)((p) => ({
                            ...p,
                            minutes: clampMinutes(parseNumber(otMinutesText)),
                          }))
                        }
                      />
                      <ThemedText>m</ThemedText>
                    </View>
                  </View>
                  {Boolean((settings?.payRules?.night as any)?.enabled) ? (
                    <>
                      <View style={styles.row}>
                        <ThemedText style={styles.rowLabel}>
                          Night (base)
                        </ThemedText>
                        <View style={styles.inline}>
                          <TextInput
                            style={styles.numInput}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            value={nightBaseHoursText}
                            onChangeText={setNightBaseHoursText}
                            onEndEditing={() =>
                              setManualNightBase((p) => ({
                                ...p,
                                hours: clampHours(
                                  parseNumber(nightBaseHoursText)
                                ),
                              }))
                            }
                          />
                          <ThemedText>h</ThemedText>
                          <TextInput
                            style={styles.numInput}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            value={nightBaseMinutesText}
                            onChangeText={setNightBaseMinutesText}
                            onEndEditing={() =>
                              setManualNightBase((p) => ({
                                ...p,
                                minutes: clampMinutes(
                                  parseNumber(nightBaseMinutesText)
                                ),
                              }))
                            }
                          />
                          <ThemedText>m</ThemedText>
                        </View>
                      </View>
                      <View style={styles.row}>
                        <ThemedText style={styles.rowLabel}>
                          Night (OT)
                        </ThemedText>
                        <View style={styles.inline}>
                          <TextInput
                            style={styles.numInput}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            value={nightOtHoursText}
                            onChangeText={setNightOtHoursText}
                            onEndEditing={() =>
                              setManualNightOt((p) => ({
                                ...p,
                                hours: clampHours(
                                  parseNumber(nightOtHoursText)
                                ),
                              }))
                            }
                          />
                          <ThemedText>h</ThemedText>
                          <TextInput
                            style={styles.numInput}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            value={nightOtMinutesText}
                            onChangeText={setNightOtMinutesText}
                            onEndEditing={() =>
                              setManualNightOt((p) => ({
                                ...p,
                                minutes: clampMinutes(
                                  parseNumber(nightOtMinutesText)
                                ),
                              }))
                            }
                          />
                          <ThemedText>m</ThemedText>
                        </View>
                      </View>
                    </>
                  ) : null}
                  {mode === "tracker" && (
                    <ThemedText style={styles.helperText}>
                      Auto-fills from your shifts for the selected date when
                      available.
                    </ThemedText>
                  )}
                </View>

                {/* Total */}
                <View style={styles.card}>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    Total Pay
                  </ThemedText>
                  <ThemedText style={styles.totalText}>
                    {currencySymbol}
                    {(breakdown?.total ?? 0).toFixed(2)}
                  </ThemedText>
                  <View style={styles.breakdownRow}>
                    <ThemedText>Base</ThemedText>
                    <ThemedText>
                      {currencySymbol}
                      {(breakdown?.base ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.breakdownRow}>
                    <ThemedText>Overtime</ThemedText>
                    <ThemedText>
                      {currencySymbol}
                      {(breakdown?.overtime ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.breakdownRow}>
                    <ThemedText>Uplifts</ThemedText>
                    <ThemedText>
                      {currencySymbol}
                      {(breakdown?.uplifts ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.breakdownRow}>
                    <ThemedText>Allowances</ThemedText>
                    <ThemedText>
                      {currencySymbol}
                      {(breakdown?.allowances ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.breakdownRow}>
                    <ThemedText>Gross</ThemedText>
                    <ThemedText>
                      {currencySymbol}
                      {(breakdown?.gross ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.breakdownRow}>
                    <ThemedText>Tax</ThemedText>
                    <ThemedText style={{ color: "#FF3B30" }}>
                      -{currencySymbol}
                      {(breakdown?.tax ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.breakdownRow}>
                    <ThemedText>NI</ThemedText>
                    <ThemedText style={{ color: "#FF3B30" }}>
                      -{currencySymbol}
                      {(breakdown?.ni ?? 0).toFixed(2)}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      Platform.OS === "web"
                        ? ({ cursor: "pointer" } as any)
                        : null,
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    <ThemedText style={styles.saveBtnText}>
                      {isSaving ? "Saving..." : "Save Pay"}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Period Filter */}
                <View style={styles.periodHeader}>
                  <SegmentedSwitcher
                    items={[
                      { id: "week", label: "Week" },
                      { id: "month", label: "Month" },
                      { id: "all", label: "All" },
                    ]}
                    activeId={period}
                    onChange={(id) => setPeriod(id as PeriodFilter)}
                  />
                  <TouchableOpacity
                    style={[
                      styles.thisWeekBtn,
                      Platform.OS === "web"
                        ? ({ cursor: "pointer" } as any)
                        : null,
                    ]}
                    onPress={() => setPeriod("week")}
                  >
                    <ThemedText style={styles.thisWeekBtnText}>
                      This Week
                    </ThemedText>
                  </TouchableOpacity>
                  {(() => {
                    const staleCount =
                      filteredHistory.filter(hasStaleEntry).length;
                    if (!staleCount) return null;
                    return (
                      <View style={{ marginTop: 8 }}>
                        <ThemedText style={{ color: "#8E8E93" }}>
                          {staleCount} entr
                          {staleCount === 1 ? "y is" : "ies are"} out of date
                          with current settings
                        </ThemedText>
                        <TouchableOpacity
                          style={[
                            styles.recalcAllBtn,
                            Platform.OS === "web"
                              ? ({ cursor: "pointer" } as any)
                              : null,
                          ]}
                          onPress={() =>
                            handleRecalcBulk(
                              filteredHistory
                                .filter(hasStaleEntry)
                                .map((e) => e.id)
                            )
                          }
                        >
                          <ThemedText style={styles.recalcAllBtnText}>
                            Recalculate all in view
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                  {pendingUndo ? (
                    <TouchableOpacity
                      style={[
                        styles.undoBtn,
                        Platform.OS === "web"
                          ? ({ cursor: "pointer" } as any)
                          : null,
                      ]}
                      onPress={handleUndo}
                    >
                      <ThemedText style={styles.undoBtnText}>Undo</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Summary Card */}
                <View style={styles.card}>
                  {/* Goal progress (Week only) */}
                  {(period === "week" || period === "month") && (
                    <View style={{ marginBottom: 12 }}>
                      {(() => {
                        const goal =
                          period === "week"
                            ? settings?.preferences?.weeklyGoal || 0
                            : settings?.preferences?.monthlyGoal || 0;
                        const achieved = summary.total || 0;
                        if (!goal || goal <= 0) {
                          return (
                            <ThemedText style={styles.goalHintText}>
                              Set a {period === "week" ? "weekly" : "monthly"}{" "}
                              goal in Settings → Preferences to track progress.
                            </ThemedText>
                          );
                        }
                        const percent = Math.max(
                          0,
                          Math.min(200, (achieved / goal) * 100)
                        );
                        const fillColor =
                          percent >= 100 ? "#28A745" : "#007AFF";
                        const remaining = Math.max(0, goal - achieved);
                        return (
                          <>
                            <View style={styles.goalHeaderRow}>
                              <ThemedText style={styles.goalTitle}>
                                {period === "week"
                                  ? "Weekly Goal"
                                  : "Monthly Goal"}
                              </ThemedText>
                              <ThemedText style={styles.goalAmounts}>
                                {currencySymbol}
                                {achieved.toFixed(2)} / {currencySymbol}
                                {goal.toFixed(2)}
                              </ThemedText>
                            </View>
                            <View style={styles.progressBarTrack}>
                              <View
                                style={[
                                  styles.progressBarFill,
                                  {
                                    width: `${Math.round(
                                      Math.min(100, percent)
                                    )}%`,
                                    backgroundColor: fillColor,
                                  },
                                ]}
                              />
                            </View>
                            <View style={styles.goalMetaRow}>
                              <View style={styles.percentBadge}>
                                <ThemedText style={styles.percentBadgeText}>
                                  {Math.round(percent)}%
                                </ThemedText>
                              </View>
                              <ThemedText style={styles.remainingText}>
                                {remaining > 0
                                  ? `${currencySymbol}${remaining.toFixed(
                                      2
                                    )} to go`
                                  : `+${currencySymbol}${(
                                      achieved - goal
                                    ).toFixed(2)} over goal`}
                              </ThemedText>
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  )}

                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryCell}>
                      <ThemedText style={styles.summaryLabel}>
                        Total Standard Pay
                      </ThemedText>
                      <ThemedText style={styles.summaryValue}>
                        {currencySymbol}
                        {summary.base.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryCell}>
                      <ThemedText style={styles.summaryLabel}>
                        Total Overtime Pay
                      </ThemedText>
                      <ThemedText style={styles.summaryValue}>
                        {currencySymbol}
                        {summary.overtime.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryCell}>
                      <ThemedText style={styles.summaryLabel}>
                        Total Tax
                      </ThemedText>
                      <ThemedText style={styles.summaryNegValue}>
                        {currencySymbol}
                        {summary.tax.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryCell}>
                      <ThemedText style={styles.summaryLabel}>
                        Total NI
                      </ThemedText>
                      <ThemedText style={styles.summaryNegValue}>
                        {currencySymbol}
                        {summary.ni.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryCell}>
                      <ThemedText style={styles.summaryLabel}>
                        Total Hours
                      </ThemedText>
                      <ThemedText style={styles.summaryValue}>
                        {minutesToHMText(summary.minutes)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryCell}>
                      <ThemedText style={styles.summaryLabel}>
                        Gross Total
                      </ThemedText>
                      <ThemedText style={styles.summaryPositive}>
                        {currencySymbol}
                        {summary.gross.toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryCell}>
                      <ThemedText style={styles.summaryLabel}>
                        Final Total
                      </ThemedText>
                      <ThemedText style={styles.summaryPositive}>
                        {currencySymbol}
                        {summary.total.toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Grouped daily list */}
                {groupedByDate.length === 0 ? (
                  <View style={[styles.card, { marginTop: 12 }]}>
                    <ThemedText>No saved pay calculations yet</ThemedText>
                  </View>
                ) : (
                  groupedByDate.map(([dateKey, entries]) => {
                    return (
                      <View
                        key={dateKey}
                        style={[styles.card, { marginTop: 12 }]}
                      >
                        <View style={styles.dayHeader}>
                          <ThemedText type="subtitle" style={styles.dayTitle}>
                            {formatDateDisplay(dateKey)}
                          </ThemedText>
                          <ThemedText style={styles.submissionsCount}>
                            {entries.length}{" "}
                            {entries.length === 1
                              ? "submission"
                              : "submissions"}
                          </ThemedText>
                        </View>

                        {entries.map((entry) => {
                          const savedBaseVal = resolveRateValue(
                            entry.input.hourlyRateId
                          );
                          const baseRateVal =
                            (typeof savedBaseVal === "number"
                              ? savedBaseVal
                              : entry.rateSnapshot?.base) ?? 0;
                          const savedOtVal = resolveRateValue(
                            entry.input.overtimeRateId
                          );
                          const overtimeRateVal =
                            (typeof savedOtVal === "number"
                              ? savedOtVal
                              : entry.rateSnapshot?.overtime) ?? baseRateVal;
                          const baseMinutes = hmToMinutes(
                            entry.input.hoursWorked
                          );
                          const overtimeMinutes = hmToMinutes(
                            entry.input.overtimeWorked
                          );
                          const baseAmount = baseRateVal * (baseMinutes / 60);
                          const overtimeAmount =
                            overtimeRateVal * (overtimeMinutes / 60);
                          const totalBeforeDeductions =
                            (entry.calculatedPay as any).gross ??
                            entry.calculatedPay.base +
                              entry.calculatedPay.overtime +
                              entry.calculatedPay.uplifts +
                              entry.calculatedPay.allowances;
                          const isExpanded = expandedIds.has(entry.id);
                          const totalMinutes = baseMinutes + overtimeMinutes;
                          return (
                            <View key={entry.id} style={styles.entryContainer}>
                              <TouchableOpacity
                                style={[
                                  styles.entryHeader,
                                  Platform.OS === "web"
                                    ? ({ cursor: "pointer" } as any)
                                    : null,
                                ]}
                                onPress={() => toggleExpanded(entry.id)}
                                accessibilityLabel="Toggle entry details"
                              >
                                <View style={{ flex: 1 }}>
                                  <ThemedText style={styles.entrySubmittedAt}>
                                    Submitted at:{" "}
                                    {formatTimeOfDay(entry.createdAt)}
                                  </ThemedText>
                                  <ThemedText style={styles.finalTotalText}>
                                    Final Total: {currencySymbol}
                                    {entry.calculatedPay.total.toFixed(2)}
                                  </ThemedText>
                                  <ThemedText style={styles.entryCollapsedMeta}>
                                    Hours: {minutesToHMText(totalMinutes)}
                                  </ThemedText>
                                </View>
                                <ThemedText style={styles.expandIconSmall}>
                                  {isExpanded ? "▼" : "▶"}
                                </ThemedText>
                              </TouchableOpacity>

                              {isExpanded ? (
                                <>
                                  <ThemedText style={styles.entryTotalBefore}>
                                    Total (before deductions): {currencySymbol}
                                    {totalBeforeDeductions.toFixed(2)}
                                  </ThemedText>

                                  <View style={styles.lineItemRow}>
                                    <ThemedText style={styles.lineItemLabel}>
                                      Standard:
                                    </ThemedText>
                                    <ThemedText style={styles.lineItemValue}>
                                      {formatHMClock(entry.input.hoursWorked)} @{" "}
                                      {currencySymbol}
                                      {baseRateVal.toFixed(2)}
                                    </ThemedText>
                                  </View>
                                  <ThemedText style={styles.lineItemAmount}>
                                    {currencySymbol}
                                    {baseAmount.toFixed(2)}
                                  </ThemedText>

                                  {overtimeMinutes > 0 ? (
                                    <>
                                      <View style={styles.lineItemRow}>
                                        <ThemedText
                                          style={styles.lineItemLabel}
                                        >
                                          Overtime:
                                        </ThemedText>
                                        <ThemedText
                                          style={styles.lineItemValue}
                                        >
                                          {formatHMClock(
                                            entry.input.overtimeWorked
                                          )}{" "}
                                          @ {currencySymbol}
                                          {overtimeRateVal.toFixed(2)}
                                        </ThemedText>
                                      </View>
                                      <ThemedText style={styles.lineItemAmount}>
                                        {currencySymbol}
                                        {overtimeAmount.toFixed(2)}
                                      </ThemedText>
                                    </>
                                  ) : null}

                                  <ThemedText style={styles.deductionText}>
                                    Tax: {currencySymbol}
                                    {Number(
                                      (entry.calculatedPay as any).tax ?? 0
                                    ).toFixed(2)}
                                  </ThemedText>
                                  <ThemedText style={styles.deductionText}>
                                    NI: {currencySymbol}
                                    {Number(
                                      (entry.calculatedPay as any).ni ?? 0
                                    ).toFixed(2)}
                                  </ThemedText>

                                  <View style={styles.actionsRow}>
                                    {hasStaleEntry(entry) ? (
                                      <View style={{ marginBottom: 8 }}>
                                        <ThemedText
                                          style={{ color: "#8E8E93" }}
                                        >
                                          Updated tax settings available
                                        </ThemedText>
                                        <TouchableOpacity
                                          style={[
                                            styles.recalcBtn,
                                            Platform.OS === "web"
                                              ? ({ cursor: "pointer" } as any)
                                              : null,
                                          ]}
                                          onPress={() =>
                                            handleRecalcEntry(entry)
                                          }
                                        >
                                          <ThemedText
                                            style={styles.recalcBtnText}
                                          >
                                            Recalculate with current settings
                                          </ThemedText>
                                        </TouchableOpacity>
                                      </View>
                                    ) : null}
                                    <TouchableOpacity
                                      style={[
                                        styles.actionsBtn,
                                        Platform.OS === "web"
                                          ? ({ cursor: "pointer" } as any)
                                          : null,
                                      ]}
                                      onPress={async () => {
                                        if (Platform.OS === "web") {
                                          const ok =
                                            typeof window !== "undefined" &&
                                            window.confirm(
                                              "Remove this saved calculation?"
                                            );
                                          if (!ok) return;
                                          await settingsService.deletePayCalculation(
                                            entry.id
                                          );
                                          setPayHistory((prev) =>
                                            prev.filter(
                                              (e) => e.id !== entry.id
                                            )
                                          );
                                          return;
                                        }
                                        Alert.alert(
                                          "Delete entry",
                                          "Remove this saved calculation?",
                                          [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                              text: "Delete",
                                              style: "destructive",
                                              onPress: async () => {
                                                await settingsService.deletePayCalculation(
                                                  entry.id
                                                );
                                                setPayHistory((prev) =>
                                                  prev.filter(
                                                    (e) => e.id !== entry.id
                                                  )
                                                );
                                              },
                                            },
                                          ]
                                        );
                                      }}
                                    >
                                      <ThemedText style={styles.actionsBtnText}>
                                        Delete
                                      </ThemedText>
                                    </TouchableOpacity>
                                  </View>
                                </>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  webMaxWidth: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  headerRow: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
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
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rateInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectLike: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    width: 90,
    fontWeight: "600",
  },
  numInput: {
    width: 60,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: "center",
  },
  rateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  helperText: {
    marginTop: 8,
    fontStyle: "italic",
  },
  totalText: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 36,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
  },
  saveBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  // History styles
  periodHeader: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  thisWeekBtn: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  thisWeekBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCell: {
    width: "48%",
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: "700",
  },
  summaryPositive: {
    fontWeight: "700",
    color: "#28A745",
  },
  summaryNegValue: {
    fontWeight: "700",
    color: "#FF3B30",
  },
  goalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  goalTitle: {
    fontWeight: "700",
  },
  goalAmounts: {
    fontWeight: "600",
  },
  goalMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  percentBadgeText: {
    fontWeight: "700",
  },
  remainingText: {
    opacity: 0.8,
  },
  goalHintText: {
    fontStyle: "italic",
    opacity: 0.8,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayTitle: {
    fontWeight: "700",
  },
  submissionsCount: {
    opacity: 0.7,
  },
  entryContainer: {
    borderTopWidth: 1,
    borderTopColor: "#EFEFF4",
    paddingTop: 8,
    marginTop: 8,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  entrySubmittedAt: {
    opacity: 0.8,
  },
  entryCollapsedMeta: {
    opacity: 0.8,
  },
  entryTotalBefore: {
    marginTop: 6,
    fontWeight: "600",
  },
  expandIconSmall: {
    opacity: 0.6,
  },
  lineItemRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lineItemLabel: {
    fontWeight: "600",
  },
  lineItemValue: {
    opacity: 0.9,
  },
  lineItemAmount: {
    marginTop: 2,
    alignSelf: "flex-end",
  },
  deductionText: {
    marginTop: 6,
    color: "#FF3B30",
  },
  finalTotalText: {
    marginTop: 6,
    color: "#28A745",
    fontWeight: "700",
  },
  actionsRow: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  actionsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  actionsBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  recalcBtn: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignSelf: "flex-start",
  },
  recalcBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  recalcAllBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  recalcAllBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  undoBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8E8E93",
  },
  undoBtnText: {
    color: "#8E8E93",
    fontWeight: "600",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  webPointer: Platform.select({ web: { cursor: "pointer" } as any }),
});
