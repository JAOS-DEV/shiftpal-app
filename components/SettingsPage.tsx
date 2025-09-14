import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import {
  AllowanceItem,
  AppSettings,
  PayRate,
  PayRateType,
  PayRules,
  Preferences,
} from "@/types/settings";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "./Dropdown";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function SettingsPage() {
  const { themeMode, setThemeMode, colors } = useTheme();
  const { signOutUser } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [newRate, setNewRate] = useState<{
    label: string;
    value: string;
    type: PayRateType;
  }>({ label: "", value: "", type: "base" });
  const currencySymbol = useMemo(
    () =>
      settings?.preferences?.currency === "USD"
        ? "$"
        : settings?.preferences?.currency === "EUR"
        ? "€"
        : "£",
    [settings?.preferences?.currency]
  );
  const [newAllowance, setNewAllowance] = useState<{
    label: string;
    value: string;
    unit: AllowanceItem["unit"];
  }>({ label: "", value: "", unit: "perShift" });

  // Local text state for numeric fields to allow decimals and smoother typing
  const [taxPctText, setTaxPctText] = useState("");
  const [niPctText, setNiPctText] = useState("");
  const [overtimeDailyThresholdText, setOvertimeDailyThresholdText] =
    useState("");
  const [overtimeDailyMultiplierText, setOvertimeDailyMultiplierText] =
    useState("");
  const [overtimeWeeklyThresholdText, setOvertimeWeeklyThresholdText] =
    useState("");
  const [overtimeWeeklyMultiplierText, setOvertimeWeeklyMultiplierText] =
    useState("");
  const [nightValueText, setNightValueText] = useState("");
  const [weekendValueText, setWeekendValueText] = useState("");
  const [payPeriodStartDateText, setPayPeriodStartDateText] = useState("");
  const [weeklyGoalText, setWeeklyGoalText] = useState("");
  const [monthlyGoalText, setMonthlyGoalText] = useState("");

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOutUser,
      },
    ]);
  };

  useEffect(() => {
    const load = async () => {
      const s = await settingsService.getSettings();
      setSettings(s);
    };
    load();
  }, []);

  // Sync numeric text inputs when settings change
  useEffect(() => {
    setTaxPctText(
      settings?.payRules?.tax?.percentage !== undefined &&
        settings?.payRules?.tax?.percentage !== null
        ? String(settings?.payRules?.tax?.percentage)
        : ""
    );
    setNiPctText(
      settings?.payRules?.ni?.percentage !== undefined &&
        settings?.payRules?.ni?.percentage !== null
        ? String(settings?.payRules?.ni?.percentage)
        : ""
    );
    setOvertimeDailyThresholdText(
      settings?.payRules?.overtime?.dailyThreshold !== undefined &&
        settings?.payRules?.overtime?.dailyThreshold !== null
        ? String(settings?.payRules?.overtime?.dailyThreshold)
        : ""
    );
    setOvertimeDailyMultiplierText(
      settings?.payRules?.overtime?.dailyMultiplier !== undefined &&
        settings?.payRules?.overtime?.dailyMultiplier !== null
        ? String(settings?.payRules?.overtime?.dailyMultiplier)
        : ""
    );
    setOvertimeWeeklyThresholdText(
      settings?.payRules?.overtime?.weeklyThreshold !== undefined &&
        settings?.payRules?.overtime?.weeklyThreshold !== null
        ? String(settings?.payRules?.overtime?.weeklyThreshold)
        : ""
    );
    setOvertimeWeeklyMultiplierText(
      settings?.payRules?.overtime?.weeklyMultiplier !== undefined &&
        settings?.payRules?.overtime?.weeklyMultiplier !== null
        ? String(settings?.payRules?.overtime?.weeklyMultiplier)
        : ""
    );
    setNightValueText(
      settings?.payRules?.night?.value !== undefined &&
        settings?.payRules?.night?.value !== null
        ? String(settings?.payRules?.night?.value)
        : ""
    );
    setWeekendValueText(
      settings?.payRules?.weekend?.value !== undefined &&
        settings?.payRules?.weekend?.value !== null
        ? String(settings?.payRules?.weekend?.value)
        : ""
    );
    setPayPeriodStartDateText(
      settings?.payRules?.payPeriod?.startDate !== undefined &&
        settings?.payRules?.payPeriod?.startDate !== null
        ? String(settings?.payRules?.payPeriod?.startDate)
        : ""
    );
    setWeeklyGoalText(
      settings?.preferences?.weeklyGoal !== undefined &&
        settings?.preferences?.weeklyGoal !== null
        ? String(settings?.preferences?.weeklyGoal)
        : ""
    );
    setMonthlyGoalText(
      settings?.preferences?.monthlyGoal !== undefined &&
        settings?.preferences?.monthlyGoal !== null
        ? String(settings?.preferences?.monthlyGoal)
        : ""
    );
  }, [settings]);

  const addRate = async () => {
    if (!newRate.label || !newRate.value) return;
    const valueNum = parseFloat(newRate.value);
    if (Number.isNaN(valueNum)) return;
    const created = await settingsService.addPayRate({
      label: newRate.label,
      value: valueNum,
      type: newRate.type,
    });
    setSettings((prev) =>
      prev ? { ...prev, payRates: [created, ...prev.payRates] } : prev
    );
    setNewRate({ label: "", value: "", type: "base" });
  };

  const deleteRate = async (id: string) => {
    await settingsService.deletePayRate(id);
    setSettings((prev) =>
      prev
        ? { ...prev, payRates: prev.payRates.filter((r) => r.id !== id) }
        : prev
    );
  };

  const updatePreferences = async (updates: Partial<Preferences>) => {
    const next = await settingsService.setPreferences(updates);
    setSettings(next);
  };

  const updatePayRules = async (updates: Partial<PayRules>) => {
    const next = await settingsService.setPayRules(updates);
    setSettings(next);
  };

  const cycle = <T,>(current: T, options: T[]): T => {
    const idx = options.findIndex((o) => o === current);
    return options[(idx + 1 + options.length) % options.length];
  };

  const getThemeButtonStyle = (mode: "light" | "dark" | "system") => [
    styles.themeButton,
    themeMode === mode && { backgroundColor: colors.primary },
  ];

  const getThemeTextStyle = (mode: "light" | "dark" | "system") => [
    styles.themeButtonText,
    themeMode === mode && { color: "white" },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
        Settings
      </ThemedText>

      {/* Saved Pay Rates */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Saved Pay Rates
        </ThemedText>

        <View style={{ gap: 12 }}>
          <View style={styles.rowGap}>
            <TextInput
              placeholder="Label (e.g., Standard Rate)"
              placeholderTextColor={colors.textSecondary}
              value={newRate.label}
              onChangeText={(t) => setNewRate((p) => ({ ...p, label: t }))}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
            <View style={styles.inlineInputs}>
              <TextInput
                placeholder={`${currencySymbol} / hour`}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textSecondary}
                value={newRate.value}
                onChangeText={(t) => setNewRate((p) => ({ ...p, value: t }))}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
              <Dropdown
                compact
                placeholder="Type"
                style={{ width: 140 }}
                value={newRate.type}
                onChange={(v) => setNewRate((p) => ({ ...p, type: v as any }))}
                items={[
                  { value: "base", label: "Base" },
                  { value: "overtime", label: "Overtime" },
                  { value: "premium", label: "Premium" },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.primary }]}
              onPress={addRate}
            >
              <ThemedText
                style={[styles.actionButtonText, { color: colors.primary }]}
              >
                Add Rate
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8 }}>
            {settings?.payRates?.length ? (
              settings.payRates.map((r: PayRate) => (
                <View
                  key={r.id}
                  style={[styles.rateRow, { borderColor: colors.border }]}
                >
                  <ThemedText style={{ fontWeight: "600" }}>
                    {r.label}
                  </ThemedText>
                  <View style={styles.rateMeta}>
                    <ThemedText>
                      {currencySymbol}
                      {r.value.toFixed(2)}
                    </ThemedText>
                    <ThemedText style={styles.rateType}>{r.type}</ThemedText>
                    <TouchableOpacity onPress={() => deleteRate(r.id)}>
                      <ThemedText style={{ color: colors.error }}>
                        Delete
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <ThemedText style={{ color: colors.textSecondary }}>
                No rates yet. Add one above.
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* Pay Rules */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Pay Rules
        </ThemedText>

        {/* Overtime */}
        <ThemedText
          style={[styles.subsectionTitle, { color: colors.textSecondary }]}
        >
          Overtime
        </ThemedText>
        <View style={[styles.inlineInputs, { marginBottom: 8 }]}>
          <TextInput
            placeholder="Daily threshold (h)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            value={overtimeDailyThresholdText}
            onChangeText={setOvertimeDailyThresholdText}
            onEndEditing={() => {
              const n = parseFloat(overtimeDailyThresholdText || "");
              updatePayRules({
                overtime: {
                  ...(settings?.payRules?.overtime || {}),
                  dailyThreshold: Number.isNaN(n) ? undefined : n,
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
          <TextInput
            placeholder="Daily multiplier"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={overtimeDailyMultiplierText}
            onChangeText={setOvertimeDailyMultiplierText}
            onEndEditing={() => {
              const n = parseFloat(overtimeDailyMultiplierText || "");
              updatePayRules({
                overtime: {
                  ...(settings?.payRules?.overtime || {}),
                  dailyMultiplier: Number.isNaN(n) ? undefined : n,
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        </View>
        <View style={[styles.inlineInputs, { marginTop: 8 }]}>
          <TextInput
            placeholder="Weekly threshold (h)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            value={overtimeWeeklyThresholdText}
            onChangeText={setOvertimeWeeklyThresholdText}
            onEndEditing={() => {
              const n = parseFloat(overtimeWeeklyThresholdText || "");
              updatePayRules({
                overtime: {
                  ...(settings?.payRules?.overtime || {}),
                  weeklyThreshold: Number.isNaN(n) ? undefined : n,
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
          <TextInput
            placeholder="Weekly multiplier"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={overtimeWeeklyMultiplierText}
            onChangeText={setOvertimeWeeklyMultiplierText}
            onEndEditing={() => {
              const n = parseFloat(overtimeWeeklyMultiplierText || "");
              updatePayRules({
                overtime: {
                  ...(settings?.payRules?.overtime || {}),
                  weeklyMultiplier: Number.isNaN(n) ? undefined : n,
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        </View>

        {/* Night Differential */}
        <ThemedText
          style={[
            styles.subsectionTitle,
            { color: colors.textSecondary, marginTop: 16 },
          ]}
        >
          Night Differential
        </ThemedText>
        <View style={[styles.inlineInputs, { marginTop: 4, flexWrap: "wrap" }]}>
          <TextInput
            placeholder="Start (HH:MM)"
            placeholderTextColor={colors.textSecondary}
            value={String(settings?.payRules?.night?.start ?? "")}
            onChangeText={(t) =>
              updatePayRules({
                night: { ...(settings?.payRules?.night || {}), start: t },
              })
            }
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
          <TextInput
            placeholder="End (HH:MM)"
            placeholderTextColor={colors.textSecondary}
            value={String(settings?.payRules?.night?.end ?? "")}
            onChangeText={(t) =>
              updatePayRules({
                night: { ...(settings?.payRules?.night || {}), end: t },
              })
            }
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
          <Dropdown
            compact
            placeholder="Type"
            value={settings?.payRules?.night?.type || "percentage"}
            onChange={(v) =>
              updatePayRules({
                night: { ...(settings?.payRules?.night || {}), type: v as any },
              })
            }
            items={[
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed" },
            ]}
          />
          <TextInput
            placeholder="Value"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={nightValueText}
            onChangeText={setNightValueText}
            onEndEditing={() => {
              const n = parseFloat(nightValueText || "");
              updatePayRules({
                night: {
                  ...(settings?.payRules?.night || {}),
                  value: Number.isNaN(n) ? undefined : n,
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        </View>

        {/* Tax Calculations */}
        <ThemedText
          style={[
            styles.subsectionTitle,
            { color: colors.textSecondary, marginTop: 16 },
          ]}
        >
          Tax Calculations
        </ThemedText>
        <View style={styles.toggleRow}>
          <ThemedText style={{ flex: 1, color: colors.text }}>
            Enable Tax Calculations
          </ThemedText>
          <Switch
            value={
              !!(
                settings?.payRules?.tax?.percentage ||
                settings?.payRules?.tax?.percentage === 0
              )
            }
            onValueChange={(val) => {
              if (val) {
                const current = settings?.payRules?.tax?.percentage;
                const nextVal = typeof current === "number" ? current : 20;
                setTaxPctText(String(nextVal));
                updatePayRules({
                  tax: {
                    ...(settings?.payRules?.tax || {}),
                    percentage: nextVal,
                    type: "flat",
                  },
                });
              } else {
                setTaxPctText("");
                updatePayRules({
                  tax: {
                    ...(settings?.payRules?.tax || {}),
                    percentage: undefined,
                    type: "flat",
                  },
                });
              }
            }}
          />
        </View>
        <ThemedText
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          Show after-tax earnings in pay breakdown.
        </ThemedText>
        <View style={[styles.inlineInputs, { marginTop: 8, flexWrap: "wrap" }]}>
          <TextInput
            placeholder="Tax rate (%)"
            placeholderTextColor={colors.textSecondary}
            keyboardType={Platform.OS === "web" ? "default" : "decimal-pad"}
            editable={
              !!(
                settings?.payRules?.tax?.percentage ||
                settings?.payRules?.tax?.percentage === 0
              )
            }
            value={taxPctText}
            onChangeText={setTaxPctText}
            onEndEditing={() => {
              const n = parseFloat(taxPctText || "");
              updatePayRules({
                tax: {
                  ...(settings?.payRules?.tax || {}),
                  percentage: Number.isNaN(n) ? undefined : n,
                  type: "flat",
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        </View>
        <ThemedText
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          Standard UK tax rate is 20%. This will show after-tax earnings.
        </ThemedText>

        {/* National Insurance */}
        <ThemedText
          style={[
            styles.subsectionTitle,
            { color: colors.textSecondary, marginTop: 16 },
          ]}
        >
          National Insurance
        </ThemedText>
        <View style={styles.toggleRow}>
          <ThemedText style={{ flex: 1, color: colors.text }}>
            Enable NI Calculations
          </ThemedText>
          <Switch
            value={
              !!(
                settings?.payRules?.ni?.percentage ||
                settings?.payRules?.ni?.percentage === 0
              )
            }
            onValueChange={(val) => {
              if (val) {
                const current = settings?.payRules?.ni?.percentage;
                const nextVal = typeof current === "number" ? current : 12;
                setNiPctText(String(nextVal));
                updatePayRules({
                  ni: {
                    ...(settings?.payRules?.ni || {}),
                    percentage: nextVal,
                    type: "flat",
                  },
                });
              } else {
                setNiPctText("");
                updatePayRules({
                  ni: {
                    ...(settings?.payRules?.ni || {}),
                    percentage: undefined,
                    type: "flat",
                  },
                });
              }
            }}
          />
        </View>
        <ThemedText
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          Show after-NI earnings in pay breakdown.
        </ThemedText>
        <View style={[styles.inlineInputs, { marginTop: 8, flexWrap: "wrap" }]}>
          <TextInput
            placeholder="NI rate (%)"
            placeholderTextColor={colors.textSecondary}
            keyboardType={Platform.OS === "web" ? "default" : "decimal-pad"}
            editable={
              !!(
                settings?.payRules?.ni?.percentage ||
                settings?.payRules?.ni?.percentage === 0
              )
            }
            value={niPctText}
            onChangeText={setNiPctText}
            onEndEditing={() => {
              const n = parseFloat(niPctText || "");
              updatePayRules({
                ni: {
                  ...(settings?.payRules?.ni || {}),
                  percentage: Number.isNaN(n) ? undefined : n,
                  type: "flat",
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        </View>
        <ThemedText
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          UK NI rates: 12% on earnings between £12,570–£50,270, 2% above
          £50,270. This will show after-NI earnings.
        </ThemedText>

        {/* Weekend Uplift */}
        <ThemedText
          style={[
            styles.subsectionTitle,
            { color: colors.textSecondary, marginTop: 16 },
          ]}
        >
          Weekend Uplift
        </ThemedText>
        <View style={[styles.inlineInputs, { marginTop: 4, flexWrap: "wrap" }]}>
          <View style={styles.chipGroup}>
            {(["Sat", "Sun"] as const).map((day) => {
              const on = settings?.payRules?.weekend?.days?.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.chip, on && styles.chipActive]}
                  onPress={() => {
                    const current = new Set(
                      settings?.payRules?.weekend?.days || []
                    );
                    on ? current.delete(day) : current.add(day);
                    const nextDays = Array.from(current) as any;
                    // Optimistic local update to avoid flicker
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            payRules: {
                              ...prev.payRules,
                              weekend: {
                                ...(prev.payRules?.weekend || {}),
                                days: nextDays,
                              },
                            },
                          }
                        : prev
                    );
                    updatePayRules({
                      weekend: {
                        ...(settings?.payRules?.weekend || {}),
                        days: nextDays,
                      },
                    }).catch(() => {});
                  }}
                >
                  <ThemedText
                    style={[styles.chipText, on && styles.chipTextActive]}
                  >
                    {day}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.inlineInputs, { flexWrap: "wrap" }]}>
            <Dropdown
              compact
              placeholder="Type"
              value={settings?.payRules?.weekend?.type || "fixed"}
              onChange={(v) =>
                updatePayRules({
                  weekend: {
                    ...(settings?.payRules?.weekend || {}),
                    type: v as any,
                  },
                })
              }
              items={[
                { value: "fixed", label: "Fixed" },
                { value: "percentage", label: "Percentage" },
              ]}
            />
          </View>
          <TextInput
            placeholder="Value"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={weekendValueText}
            onChangeText={setWeekendValueText}
            onEndEditing={() => {
              const n = parseFloat(weekendValueText || "");
              updatePayRules({
                weekend: {
                  ...(settings?.payRules?.weekend || {}),
                  value: Number.isNaN(n) ? undefined : n,
                },
              });
            }}
            style={[
              styles.input,
              styles.flex1,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
        </View>

        {/* Allowances */}
        <ThemedText
          style={[
            styles.subsectionTitle,
            { color: colors.textSecondary, marginTop: 16 },
          ]}
        >
          Allowances
        </ThemedText>
        <View style={styles.allowanceForm}>
          <View>
            <ThemedText
              style={[styles.inputLabel, { color: colors.textSecondary }]}
            >
              Label
            </ThemedText>
            <TextInput
              placeholder="Label (e.g., Meal)"
              placeholderTextColor={colors.textSecondary}
              value={newAllowance.label}
              onChangeText={(t) => setNewAllowance((p) => ({ ...p, label: t }))}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
          </View>

          <View style={[styles.inlineInputs, { flexWrap: "wrap" }]}>
            <View style={{ flex: 1, maxWidth: 160 }}>
              <ThemedText
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Value
              </ThemedText>
              <TextInput
                placeholder="Value"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={newAllowance.value}
                onChangeText={(t) =>
                  setNewAllowance((p) => ({ ...p, value: t }))
                }
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <View style={{ flex: 1, maxWidth: 180 }}>
              <ThemedText
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Unit
              </ThemedText>
              <Dropdown
                compact
                placeholder="Unit"
                style={{ width: "100%" }}
                value={newAllowance.unit}
                onChange={(v) =>
                  setNewAllowance((p) => ({ ...p, unit: v as any }))
                }
                items={[
                  { value: "perShift", label: "perShift" },
                  { value: "perHour", label: "perHour" },
                  { value: "perKm", label: "perKm" },
                ]}
              />
            </View>
            <View style={{ justifyContent: "flex-end", minWidth: 100 }}>
              <ThemedText
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Action
              </ThemedText>
              <TouchableOpacity
                style={[styles.smallButton, { borderColor: colors.primary }]}
                onPress={async () => {
                  if (!newAllowance.label || !newAllowance.value) return;
                  const n = parseFloat(newAllowance.value);
                  if (Number.isNaN(n)) return;
                  const nextList: AllowanceItem[] = [
                    ...(settings?.payRules?.allowances || []),
                    {
                      id: Date.now().toString(36),
                      type: newAllowance.label,
                      value: n,
                      unit: newAllowance.unit,
                    },
                  ];
                  await updatePayRules({ allowances: nextList });
                  setNewAllowance({ label: "", value: "", unit: "perShift" });
                }}
              >
                <ThemedText
                  style={[styles.actionButtonText, { color: colors.primary }]}
                >
                  Add
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ gap: 8, marginTop: 8 }}>
          {(settings?.payRules?.allowances || []).map((a) => (
            <View
              key={a.id}
              style={[styles.rateRow, { borderColor: colors.border }]}
            >
              <ThemedText style={{ fontWeight: "600" }}>{a.type}</ThemedText>
              <View style={styles.rateMeta}>
                <ThemedText>
                  {currencySymbol}
                  {a.value.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.rateType}>{a.unit}</ThemedText>
                <TouchableOpacity
                  onPress={async () => {
                    const filtered = (
                      settings?.payRules?.allowances || []
                    ).filter((x) => x.id !== a.id);
                    await updatePayRules({ allowances: filtered });
                  }}
                >
                  <ThemedText style={{ color: colors.error }}>
                    Delete
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {!(settings?.payRules?.allowances || []).length && (
            <ThemedText style={{ color: colors.textSecondary }}>
              No allowances yet. Add one above.
            </ThemedText>
          )}
        </View>

        {/* Pay Period */}
        <ThemedText
          style={[
            styles.subsectionTitle,
            { color: colors.textSecondary, marginTop: 16 },
          ]}
        >
          Pay Period
        </ThemedText>
        <View style={[styles.inlineInputs, { marginTop: 4 }]}>
          <Dropdown
            compact
            placeholder="Cycle"
            value={settings?.payRules?.payPeriod?.cycle || "weekly"}
            onChange={(v) =>
              updatePayRules({
                payPeriod: {
                  ...(settings?.payRules?.payPeriod || {}),
                  cycle: v as any,
                },
              })
            }
            items={[
              { value: "weekly", label: "Weekly" },
              { value: "fortnightly", label: "Fortnightly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
          {(settings?.payRules?.payPeriod?.cycle || "weekly") === "monthly" ? (
            <TextInput
              placeholder="Start date (1-31)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={payPeriodStartDateText}
              onChangeText={setPayPeriodStartDateText}
              onEndEditing={() => {
                const n = parseInt(payPeriodStartDateText || "", 10);
                updatePayRules({
                  payPeriod: {
                    ...(settings?.payRules?.payPeriod || { cycle: "monthly" }),
                    startDate: Number.isNaN(n) ? undefined : n,
                  },
                });
              }}
              style={[
                styles.input,
                styles.flex1,
                { color: colors.text, borderColor: colors.border },
              ]}
            />
          ) : (
            <Dropdown
              compact
              placeholder="Start day"
              value={settings?.payRules?.payPeriod?.startDay || "Monday"}
              onChange={(v) =>
                updatePayRules({
                  payPeriod: {
                    cycle: (settings?.payRules?.payPeriod?.cycle ||
                      "weekly") as any,
                    startDay: v as any,
                    startDate: settings?.payRules?.payPeriod?.startDate,
                  },
                })
              }
              items={[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((d) => ({ value: d, label: d }))}
            />
          )}
        </View>
      </View>

      {/* Theme Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Appearance
        </ThemedText>

        <View style={styles.themeOptions}>
          <TouchableOpacity
            style={getThemeButtonStyle("light")}
            onPress={() => setThemeMode("light")}
            accessibilityLabel="Light theme"
          >
            <ThemedText style={getThemeTextStyle("light")}>☀️ Light</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={getThemeButtonStyle("dark")}
            onPress={() => setThemeMode("dark")}
            accessibilityLabel="Dark theme"
          >
            <ThemedText style={getThemeTextStyle("dark")}>🌙 Dark</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={getThemeButtonStyle("system")}
            onPress={() => setThemeMode("system")}
            accessibilityLabel="System theme"
          >
            <ThemedText style={getThemeTextStyle("system")}>
              📱 System
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText
          style={[styles.sectionDescription, { color: colors.textSecondary }]}
        >
          Current:{" "}
          {themeMode === "system"
            ? "System Default"
            : themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
        </ThemedText>
      </View>

      {/* Preferences (subset) */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Preferences
        </ThemedText>
        <View style={[styles.inlineInputs, { flexWrap: "wrap" }]}>
          <Dropdown
            compact
            placeholder="Currency"
            value={settings?.preferences?.currency || "GBP"}
            onChange={(v) => updatePreferences({ currency: v as any })}
            items={[
              { value: "GBP", label: "GBP (£)" },
              { value: "USD", label: "USD ($)" },
              { value: "EUR", label: "EUR (€)" },
            ]}
          />
          <Dropdown
            compact
            placeholder="Time format"
            value={settings?.preferences?.timeFormat || "24h"}
            onChange={(v) => updatePreferences({ timeFormat: v as any })}
            items={[
              { value: "24h", label: "24-hour" },
              { value: "12h", label: "12-hour" },
            ]}
          />
        </View>

        {/* Goals */}
        <View style={styles.goalsGroup}>
          <ThemedText
            style={[styles.subsectionTitle, { color: colors.textSecondary }]}
          >
            Goals
          </ThemedText>
          <ThemedText
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Net totals are used. Progress appears in Pay → History for Week or
            Month.
          </ThemedText>
          <View style={styles.inlineInputs}>
            <View style={styles.goalField}>
              <ThemedText
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Weekly goal
              </ThemedText>
              <TextInput
                placeholder={`${currencySymbol}`}
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={weeklyGoalText}
                onChangeText={setWeeklyGoalText}
                onEndEditing={async () => {
                  const n = parseFloat(weeklyGoalText || "");
                  const next = await settingsService.setPreferences({
                    weeklyGoal: Number.isNaN(n) ? undefined : n,
                  });
                  setSettings(next);
                }}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <View style={styles.goalField}>
              <ThemedText
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Monthly goal
              </ThemedText>
              <TextInput
                placeholder={`${currencySymbol}`}
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={monthlyGoalText}
                onChangeText={setMonthlyGoalText}
                onEndEditing={async () => {
                  const n = parseFloat(monthlyGoalText || "");
                  const next = await settingsService.setPreferences({
                    monthlyGoal: Number.isNaN(n) ? undefined : n,
                  });
                  setSettings(next);
                }}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Account
        </ThemedText>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.error }]}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
        >
          <ThemedText
            style={[styles.actionButtonText, { color: colors.error }]}
          >
            Sign Out
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          About
        </ThemedText>

        <View style={styles.infoRow}>
          <ThemedText
            style={[styles.infoLabel, { color: colors.textSecondary }]}
          >
            App Version
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: colors.text }]}>
            1.0.0
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText
            style={[styles.infoLabel, { color: colors.textSecondary }]}
          >
            Build
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: colors.text }]}>
            Development
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  themeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    // Remove any potential pointerEvents issues
    pointerEvents: "auto",
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  smallButton: {
    height: 41,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  goalField: {
    flex: 1,
  },
  goalsGroup: {
    marginTop: 12,
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  inlineInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowGap: {
    gap: 8,
  },
  allowanceForm: {
    gap: 8,
  },
  pillSelect: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipGroup: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#F8F8F8",
  },
  chipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    fontWeight: "600",
    color: "#111",
  },
  chipTextActive: {
    color: "#fff",
  },
  rateRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rateType: {
    color: "#666",
  },
  flex1: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
});
