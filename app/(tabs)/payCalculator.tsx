import { DateSelector } from "@/components/DateSelector";
import { SegmentedSwitcher } from "@/components/SegmentedSwitcher";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { settingsService } from "@/services/settingsService";
import {
  AppSettings,
  HoursAndMinutes,
  PayBreakdown,
  PayCalculationEntry,
  PayCalculationInput,
  PayRate,
} from "@/types/settings";
import { formatDateDisplay, getCurrentDateString } from "@/utils/timeUtils";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  const [topTab, setTopTab] = useState<TopTab>("calculator");
  const [mode, setMode] = useState<Mode>("tracker");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [date, setDate] = useState<string>(getCurrentDateString());
  const [hourlyRateId, setHourlyRateId] = useState<string | null>(null);
  const [overtimeRateId, setOvertimeRateId] = useState<string | null>(null);
  const [hoursWorked, setHoursWorked] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [overtimeWorked, setOvertimeWorked] = useState<HoursAndMinutes>({
    hours: 0,
    minutes: 0,
  });
  const [breakdown, setBreakdown] = useState<PayBreakdown | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [payHistory, setPayHistory] = useState<PayCalculationEntry[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("week");
  const insets = useSafeAreaInsets();

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
      const s = await settingsService.getSettings();
      setSettings(s);
      const base = s.payRates.find((r) => r.type === "base");
      const ot = s.payRates.find((r) => r.type === "overtime") || base;
      setHourlyRateId(base?.id ?? null);
      setOvertimeRateId(ot?.id ?? null);
      if (mode === "tracker") {
        const hm = await settingsService.deriveTrackerHoursForDate(date);
        setHoursWorked(hm);
        setOvertimeWorked({ hours: 0, minutes: 0 });
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
    });
    return () => unsub();
  }, [mode, date]);

  // Load pay history when History tab is active
  useEffect(() => {
    const loadHistory = async () => {
      if (topTab !== "history") return;
      const list = await settingsService.getPayHistory();
      setPayHistory(list);
    };
    void loadHistory();
  }, [topTab]);

  const recalc = async () => {
    if (!settings) return;
    const input: PayCalculationInput = {
      mode,
      date,
      hourlyRateId,
      overtimeRateId,
      hoursWorked,
      overtimeWorked,
    };
    const result = settingsService.computePay(input, settings);
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
    hoursWorked,
    overtimeWorked,
  ]);

  const handleSave = async () => {
    if (!breakdown) return;
    if (!hourlyRateId) {
      Alert.alert(
        "Rate required",
        "Please select at least one base rate in Settings."
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
          hoursWorked,
          overtimeWorked,
        },
        calculatedPay: breakdown,
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

  const baseRates = (settings?.payRates || []).filter(
    (r) => r.type === "base" || r.type === "premium"
  );
  const overtimeRates = (settings?.payRates || []).filter(
    (r) => r.type === "overtime" || r.type === "premium"
  );

  const cycleRate = (currentId: string | null, list: PayRate[]) => {
    if (!list || list.length === 0) return null;
    const idx = list.findIndex((r) => r.id === currentId);
    const next = list[(idx + 1 + list.length) % list.length];
    return next?.id ?? null;
  };

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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        {/* Top tab: Calculator | History */}
        <SegmentedSwitcher
          items={[
            { id: "calculator", label: "Calculator" },
            { id: "history", label: "History" },
          ]}
          activeId={topTab}
          onChange={(id) => setTopTab(id as TopTab)}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
          showsVerticalScrollIndicator={false}
        >
          {topTab === "calculator" ? (
            <>
              <DateSelector selectedDate={date} onDateChange={setDate} />

              {/* Inner mode toggle: Tracker | Manual (match Home style) */}
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
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
                <View style={styles.inline}>
                  <TouchableOpacity
                    style={styles.selectLike}
                    onPress={() =>
                      setHourlyRateId((prev) => cycleRate(prev, baseRates))
                    }
                  >
                    <ThemedText>
                      {baseRates.find((r) => r.id === hourlyRateId)?.label ||
                        "Tap to cycle base rates"}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.selectLike}
                    onPress={() =>
                      setOvertimeRateId((prev) =>
                        cycleRate(prev, overtimeRates)
                      )
                    }
                  >
                    <ThemedText>
                      {overtimeRates.find((r) => r.id === overtimeRateId)
                        ?.label || "Tap to cycle overtime rates"}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
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
                      value={String(hoursWorked.hours)}
                      onChangeText={(t) =>
                        setHoursWorked((p) => ({ ...p, hours: parseNumber(t) }))
                      }
                    />
                    <ThemedText>h</ThemedText>
                    <TextInput
                      style={styles.numInput}
                      keyboardType="number-pad"
                      value={String(hoursWorked.minutes)}
                      onChangeText={(t) =>
                        setHoursWorked((p) => ({
                          ...p,
                          minutes: parseNumber(t),
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
                      value={String(overtimeWorked.hours)}
                      onChangeText={(t) =>
                        setOvertimeWorked((p) => ({
                          ...p,
                          hours: parseNumber(t),
                        }))
                      }
                    />
                    <ThemedText>h</ThemedText>
                    <TextInput
                      style={styles.numInput}
                      keyboardType="number-pad"
                      value={String(overtimeWorked.minutes)}
                      onChangeText={(t) =>
                        setOvertimeWorked((p) => ({
                          ...p,
                          minutes: parseNumber(t),
                        }))
                      }
                    />
                    <ThemedText>m</ThemedText>
                  </View>
                </View>
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
                  style={styles.saveBtn}
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
                  style={styles.thisWeekBtn}
                  onPress={() => setPeriod("week")}
                >
                  <ThemedText style={styles.thisWeekBtnText}>
                    This Week
                  </ThemedText>
                </TouchableOpacity>
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
                      const fillColor = percent >= 100 ? "#28A745" : "#007AFF";
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
                          {entries.length === 1 ? "submission" : "submissions"}
                        </ThemedText>
                      </View>

                      {entries.map((entry) => {
                        const baseRateVal =
                          resolveRateValue(entry.input.hourlyRateId) || 0;
                        const overtimeRateVal =
                          resolveRateValue(entry.input.overtimeRateId) ||
                          baseRateVal;
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
                        return (
                          <View key={entry.id} style={styles.entryContainer}>
                            <ThemedText style={styles.entrySubmittedAt}>
                              Submitted at: {formatTimeOfDay(entry.createdAt)}
                            </ThemedText>
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
                                  <ThemedText style={styles.lineItemLabel}>
                                    Overtime:
                                  </ThemedText>
                                  <ThemedText style={styles.lineItemValue}>
                                    {formatHMClock(entry.input.overtimeWorked)}{" "}
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
                            <ThemedText style={styles.finalTotalText}>
                              Final Total: {currencySymbol}
                              {entry.calculatedPay.total.toFixed(2)}
                            </ThemedText>

                            <View style={styles.actionsRow}>
                              <TouchableOpacity style={styles.actionsBtn}>
                                <ThemedText style={styles.actionsBtnText}>
                                  Actions
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </>
          )}
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
  entrySubmittedAt: {
    opacity: 0.8,
  },
  entryTotalBefore: {
    marginTop: 6,
    fontWeight: "600",
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
});
