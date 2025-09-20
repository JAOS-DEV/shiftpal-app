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
// Native time picker removed; using dropdowns universally for 24h control
import { notify } from "@/utils/notify";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "./Dropdown";
import { TabSwitcher } from "./TabSwitcher";
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
  const [overtimeDailyMode, setOvertimeDailyMode] = useState<
    "multiplier" | "fixed" | ""
  >("");
  const [overtimeDailyValueText, setOvertimeDailyValueText] = useState("");
  const [overtimeWeeklyThresholdText, setOvertimeWeeklyThresholdText] =
    useState("");
  const [overtimeWeeklyMode, setOvertimeWeeklyMode] = useState<
    "multiplier" | "fixed" | ""
  >("");
  const [overtimeWeeklyValueText, setOvertimeWeeklyValueText] = useState("");
  const [nightValueText, setNightValueText] = useState("");
  const [weekendMode, setWeekendMode] = useState<"multiplier" | "fixed" | "">(
    ""
  );
  const [weekendValueText, setWeekendValueText] = useState("");
  const [payPeriodStartDateText, setPayPeriodStartDateText] = useState("");
  const [weeklyGoalText, setWeeklyGoalText] = useState("");
  const [monthlyGoalText, setMonthlyGoalText] = useState("");

  const [helpModal, setHelpModal] = useState<{
    visible: boolean;
    title: string;
    body: string;
  }>({ visible: false, title: "", body: "" });
  const openHelp = (title: string, body: string) =>
    setHelpModal({ visible: true, title, body });
  const closeHelp = () => setHelpModal({ visible: false, title: "", body: "" });

  // Simple edit sheets and Advanced toggle
  const [showOvertimeSheet, setShowOvertimeSheet] = useState(false);
  const [showNightSheet, setShowNightSheet] = useState(false);
  const [showWeekendSheet, setShowWeekendSheet] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "pay" | "preferences" | "advanced"
  >("pay");

  // 24h time picker options for Night (HH:MM)
  const hoursOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const s = String(i).padStart(2, "0");
        return { value: s, label: s };
      }),
    []
  );
  const minutesOptions = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const s = String(i).padStart(2, "0");
        return { value: s, label: s };
      }),
    []
  );
  const splitTime = (t?: string | null) => {
    const def = { h: "00", m: "00" };
    if (!t || typeof t !== "string" || !t.includes(":")) return def;
    const [h, m] = t.split(":");
    const hh = String(
      Math.min(23, Math.max(0, parseInt(h || "0", 10) || 0))
    ).padStart(2, "0");
    const mm = String(
      Math.min(59, Math.max(0, parseInt(m || "0", 10) || 0))
    ).padStart(2, "0");
    return { h: hh, m: mm };
  };
  const joinTime = (h: string, m: string) =>
    `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;

  const [activePicker, setActivePicker] = useState<null | "start" | "end">(
    null
  );
  const toDateFromHM = (hm?: string | null) => {
    const { h, m } = splitTime(hm);
    const d = new Date();
    d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
    return d;
  };
  const onPickTime = (key: "start" | "end") => (_: any, date?: Date) => {
    if (Platform.OS !== "ios") setActivePicker(null);
    if (!date) return;
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    updatePayRules({
      night: {
        ...(settings?.payRules?.night || {}),
        [key]: `${hh}:${mm}`,
      },
    });
  };

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
    const ot = settings?.payRules?.overtime as any;
    const daily = ot?.daily || {};
    const weekly = ot?.weekly || {};
    const legacyDailyThreshold = ot?.dailyThreshold;
    const legacyDailyMultiplier = ot?.dailyMultiplier;
    const legacyWeeklyThreshold = ot?.weeklyThreshold;
    const legacyWeeklyMultiplier = ot?.weeklyMultiplier;
    setOvertimeDailyThresholdText(
      daily?.threshold !== undefined && daily?.threshold !== null
        ? String(daily.threshold)
        : legacyDailyThreshold !== undefined && legacyDailyThreshold !== null
        ? String(legacyDailyThreshold)
        : ""
    );
    const nextDailyMode: any = daily?.mode
      ? daily.mode
      : typeof legacyDailyMultiplier === "number"
      ? "multiplier"
      : "";
    setOvertimeDailyMode(nextDailyMode);
    const dailyValue =
      nextDailyMode === "multiplier"
        ? daily?.multiplier ?? legacyDailyMultiplier
        : daily?.uplift;
    setOvertimeDailyValueText(
      dailyValue !== undefined && dailyValue !== null ? String(dailyValue) : ""
    );
    setOvertimeWeeklyThresholdText(
      weekly?.threshold !== undefined && weekly?.threshold !== null
        ? String(weekly.threshold)
        : legacyWeeklyThreshold !== undefined && legacyWeeklyThreshold !== null
        ? String(legacyWeeklyThreshold)
        : ""
    );
    const nextWeeklyMode: any = weekly?.mode
      ? weekly.mode
      : typeof legacyWeeklyMultiplier === "number"
      ? "multiplier"
      : "";
    setOvertimeWeeklyMode(nextWeeklyMode);
    const weeklyValue =
      nextWeeklyMode === "multiplier"
        ? weekly?.multiplier ?? legacyWeeklyMultiplier
        : weekly?.uplift;
    setOvertimeWeeklyValueText(
      weeklyValue !== undefined && weeklyValue !== null
        ? String(weeklyValue)
        : ""
    );
    setNightValueText(
      settings?.payRules?.night?.value !== undefined &&
        settings?.payRules?.night?.value !== null
        ? String(settings?.payRules?.night?.value)
        : ""
    );
    const wk = settings?.payRules?.weekend as any;
    const wkMode: any = wk?.mode
      ? wk.mode
      : wk?.type === "percentage"
      ? "multiplier"
      : wk?.type === "fixed"
      ? "fixed"
      : "";
    setWeekendMode(wkMode);
    const wkValue = wkMode === "multiplier" ? wk?.multiplier : wk?.uplift;
    setWeekendValueText(
      wkValue !== undefined && wkValue !== null ? String(wkValue) : ""
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
    const valueNum = parseFloat(newRate.value.replace(/[^0-9.\-]/g, ""));
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
    notify.success("Saved");
  };

  const updatePayRules = async (updates: Partial<PayRules>) => {
    const next = await settingsService.setPayRules(updates);
    setSettings(next);
    notify.success("Saved");
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
      {/* Help Modal */}
      <Modal
        transparent
        visible={helpModal.visible}
        animationType="fade"
        onRequestClose={closeHelp}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={[styles.modalTitle, { color: colors.text }]}
            >
              {helpModal.title}
            </ThemedText>
            <ThemedText style={{ color: colors.text }}>
              {helpModal.body}
            </ThemedText>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: colors.primary }]}
              onPress={closeHelp}
            >
              <ThemedText style={{ color: colors.primary }}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
        Settings
      </ThemedText>
      <TabSwitcher
        tabs={[
          { key: "pay", label: "Pay" },
          { key: "preferences", label: "Preferences" },
          { key: "advanced", label: "Advanced" },
        ]}
        activeKey={activeSettingsTab}
        onKeyChange={(k) => setActiveSettingsTab(k as any)}
      />

      {/* Pay: Saved Rates */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            display: activeSettingsTab === "pay" ? "flex" : "none",
          },
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

      {/* Pay: Rules summary */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            display: activeSettingsTab === "pay" ? "flex" : "none",
          },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Pay Rules (Simple)
        </ThemedText>

        {/* Overtime row */}
        <View style={styles.simpleRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "600" }}>Overtime</ThemedText>
            <ThemedText style={{ color: colors.textSecondary }}>
              {(() => {
                const ot: any = settings?.payRules?.overtime || {};
                const basis = ot.active || "daily";
                const rule = basis === "weekly" ? ot.weekly : ot.daily;
                const threshold =
                  rule?.threshold ?? (basis === "weekly" ? 40 : 8);
                const mode = rule?.mode || "fixed";
                const value =
                  mode === "multiplier"
                    ? rule?.multiplier ?? 1.5
                    : rule?.uplift ?? 2;
                return `${
                  basis === "weekly" ? "Weekly" : "Daily"
                } threshold ${threshold}h • ${
                  mode === "multiplier"
                    ? `${value}×`
                    : `+${currencySymbol}${Number(value).toFixed(2)}`
                }`;
              })()}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={() => setShowOvertimeSheet(true)}
          >
            <ThemedText
              style={[styles.actionButtonText, { color: colors.primary }]}
            >
              Edit
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Night row */}
        <View style={styles.simpleRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "600" }}>Night</ThemedText>
            <ThemedText style={{ color: colors.textSecondary }}>
              {(() => {
                const n: any = settings?.payRules?.night || {};
                const enabled = n?.enabled !== false;
                const start = n?.start || "22:00";
                const end = n?.end || "06:00";
                const type = n?.type || "fixed";
                const value = Number(n?.value ?? 1);
                return `${
                  enabled
                    ? `${start}–${end} • ${
                        type === "percentage"
                          ? `+${value}%`
                          : `+${currencySymbol}${value.toFixed(2)}`
                      }`
                    : "Disabled"
                }`;
              })()}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={() => setShowNightSheet(true)}
          >
            <ThemedText
              style={[styles.actionButtonText, { color: colors.primary }]}
            >
              Edit
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Weekend row */}
        <View style={styles.simpleRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "600" }}>Weekend</ThemedText>
            <ThemedText style={{ color: colors.textSecondary }}>
              {(() => {
                const w: any = settings?.payRules?.weekend || {};
                const enabled = w?.enabled === true;
                const days = (w?.days || ["Sat", "Sun"]).join(", ");
                const mode =
                  w?.mode ||
                  (w?.type === "percentage"
                    ? "multiplier"
                    : w?.type === "fixed"
                    ? "fixed"
                    : "multiplier");
                const value =
                  mode === "multiplier"
                    ? Number(w?.multiplier ?? 1.25)
                    : Number(w?.uplift ?? 0.5);
                return `${
                  enabled
                    ? `${days} • ${
                        mode === "multiplier"
                          ? `+${Math.round((value - 1) * 100)}%`
                          : `+${currencySymbol}${value.toFixed(2)}/h`
                      }`
                    : "Disabled"
                }`;
              })()}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={() => setShowWeekendSheet(true)}
          >
            <ThemedText
              style={[styles.actionButtonText, { color: colors.primary }]}
            >
              Edit
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overtime Edit Sheet */}
      <Modal
        transparent
        visible={showOvertimeSheet}
        animationType="fade"
        onRequestClose={() => setShowOvertimeSheet(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={[styles.modalTitle, { color: colors.text }]}
            >
              Edit Overtime
            </ThemedText>
            <View style={styles.inlineInputs}>
              <Dropdown
                compact
                placeholder="Basis"
                value={(settings?.payRules?.overtime as any)?.active || "daily"}
                onChange={(v) =>
                  updatePayRules({
                    overtime: {
                      ...(settings?.payRules?.overtime as any),
                      active: v as any,
                    } as any,
                  })
                }
                items={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                ]}
              />
              <TextInput
                placeholder="Threshold (h)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={(() => {
                  const ot: any = settings?.payRules?.overtime || {};
                  const rule =
                    (ot.active || "daily") === "weekly" ? ot.weekly : ot.daily;
                  return rule?.threshold != null ? String(rule.threshold) : "";
                })()}
                onChangeText={(t) => {
                  const n = Math.max(
                    0,
                    parseFloat(t.replace(/[^0-9.]/g, "")) || 0
                  );
                  const ot: any = settings?.payRules?.overtime || {};
                  const active = ot.active || "daily";
                  updatePayRules({
                    overtime: {
                      ...ot,
                      [active]: { ...(ot[active] || {}), threshold: n },
                      enabled: true,
                    } as any,
                  });
                }}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <View style={styles.inlineInputs}>
              <Dropdown
                compact
                placeholder="Mode"
                value={(() => {
                  const ot: any = settings?.payRules?.overtime || {};
                  const active = ot.active || "daily";
                  return (ot[active] || {}).mode || "fixed";
                })()}
                onChange={(v) => {
                  const ot: any = settings?.payRules?.overtime || {};
                  const active = ot.active || "daily";
                  updatePayRules({
                    overtime: {
                      ...ot,
                      [active]: { ...(ot[active] || {}), mode: v as any },
                      enabled: true,
                    } as any,
                  });
                }}
                items={[
                  { value: "fixed", label: "Fixed uplift" },
                  { value: "multiplier", label: "Multiplier" },
                ]}
              />
              <TextInput
                placeholder="Value"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={(() => {
                  const ot: any = settings?.payRules?.overtime || {};
                  const active = ot.active || "daily";
                  const r = ot[active] || {};
                  return String(
                    (r.mode || "fixed") === "multiplier"
                      ? r.multiplier ?? ""
                      : r.uplift ?? ""
                  );
                })()}
                onChangeText={(t) => {
                  const ot: any = settings?.payRules?.overtime || {};
                  const active = ot.active || "daily";
                  const r = ot[active] || {};
                  const isMul = (r.mode || "fixed") === "multiplier";
                  const n = parseFloat(t.replace(/[^0-9.]/g, ""));
                  updatePayRules({
                    overtime: {
                      ...ot,
                      [active]: {
                        ...r,
                        [isMul ? "multiplier" : "uplift"]: isNaN(n)
                          ? undefined
                          : n,
                      },
                      enabled: true,
                    } as any,
                  });
                }}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: colors.primary }]}
              onPress={() => setShowOvertimeSheet(false)}
            >
              <ThemedText style={{ color: colors.primary }}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Night Edit Sheet */}
      <Modal
        transparent
        visible={showNightSheet}
        animationType="fade"
        onRequestClose={() => setShowNightSheet(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={[styles.modalTitle, { color: colors.text }]}
            >
              Edit Night
            </ThemedText>
            <View style={styles.toggleRow}>
              <ThemedText style={{ flex: 1, color: colors.text }}>
                Enable Night
              </ThemedText>
              <Switch
                value={Boolean((settings?.payRules?.night as any)?.enabled)}
                onValueChange={(val) =>
                  updatePayRules({
                    night: {
                      ...(settings?.payRules?.night || {}),
                      enabled: val,
                    },
                  })
                }
              />
            </View>
            <View style={[styles.inlineInputs, { marginTop: 8 }]}>
              <Dropdown
                compact
                placeholder="Start HH"
                value={splitTime(settings?.payRules?.night?.start).h}
                onChange={(v) =>
                  updatePayRules({
                    night: {
                      ...(settings?.payRules?.night || {}),
                      start: joinTime(
                        String(v),
                        splitTime(settings?.payRules?.night?.start).m
                      ),
                    },
                  })
                }
                items={hoursOptions}
              />
              <Dropdown
                compact
                placeholder="MM"
                value={splitTime(settings?.payRules?.night?.start).m}
                onChange={(v) =>
                  updatePayRules({
                    night: {
                      ...(settings?.payRules?.night || {}),
                      start: joinTime(
                        splitTime(settings?.payRules?.night?.start).h,
                        String(v)
                      ),
                    },
                  })
                }
                items={minutesOptions}
              />
              <ThemedText style={{ opacity: 0.6 }}>→</ThemedText>
              <Dropdown
                compact
                placeholder="End HH"
                value={splitTime(settings?.payRules?.night?.end).h}
                onChange={(v) =>
                  updatePayRules({
                    night: {
                      ...(settings?.payRules?.night || {}),
                      end: joinTime(
                        String(v),
                        splitTime(settings?.payRules?.night?.end).m
                      ),
                    },
                  })
                }
                items={hoursOptions}
              />
              <Dropdown
                compact
                placeholder="MM"
                value={splitTime(settings?.payRules?.night?.end).m}
                onChange={(v) =>
                  updatePayRules({
                    night: {
                      ...(settings?.payRules?.night || {}),
                      end: joinTime(
                        splitTime(settings?.payRules?.night?.end).h,
                        String(v)
                      ),
                    },
                  })
                }
                items={minutesOptions}
              />
            </View>
            <View style={[styles.inlineInputs, { marginTop: 8 }]}>
              <Dropdown
                compact
                placeholder="Type"
                value={settings?.payRules?.night?.type || "fixed"}
                onChange={(v) =>
                  updatePayRules({
                    night: {
                      ...(settings?.payRules?.night || {}),
                      type: v as any,
                    },
                  })
                }
                items={[
                  { value: "fixed", label: "Fixed" },
                  { value: "percentage", label: "Percentage" },
                ]}
              />
              <TextInput
                placeholder="Value"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={nightValueText}
                onChangeText={setNightValueText}
                onEndEditing={() => {
                  let n = parseFloat(nightValueText || "0");
                  if (Number.isNaN(n)) n = 0;
                  updatePayRules({
                    night: { ...(settings?.payRules?.night || {}), value: n },
                  });
                  setNightValueText(String(n));
                }}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: colors.primary }]}
              onPress={() => setShowNightSheet(false)}
            >
              <ThemedText style={{ color: colors.primary }}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Weekend Edit Sheet */}
      <Modal
        transparent
        visible={showWeekendSheet}
        animationType="fade"
        onRequestClose={() => setShowWeekendSheet(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={[styles.modalTitle, { color: colors.text }]}
            >
              Edit Weekend
            </ThemedText>
            <View style={styles.toggleRow}>
              <ThemedText style={{ flex: 1, color: colors.text }}>
                Enable Weekend
              </ThemedText>
              <Switch
                value={Boolean((settings?.payRules?.weekend as any)?.enabled)}
                onValueChange={(val) =>
                  updatePayRules({
                    weekend: {
                      ...(settings?.payRules?.weekend || {}),
                      enabled: val,
                    },
                  })
                }
              />
            </View>
            <View style={[styles.inlineInputs, { marginTop: 8 }]}>
              <View style={styles.chipGroup}>
                {(["Sat", "Sun"] as const).map((d) => {
                  const on = settings?.payRules?.weekend?.days?.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.chip, on && styles.chipActive]}
                      onPress={() => {
                        const current = new Set(
                          settings?.payRules?.weekend?.days || []
                        );
                        on ? current.delete(d) : current.add(d);
                        updatePayRules({
                          weekend: {
                            ...(settings?.payRules?.weekend || {}),
                            days: Array.from(current) as any,
                          },
                        });
                      }}
                    >
                      <ThemedText
                        style={[styles.chipText, on && styles.chipTextActive]}
                      >
                        {d}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={[styles.inlineInputs, { marginTop: 8 }]}>
              <Dropdown
                compact
                placeholder="Mode"
                value={
                  (settings?.payRules?.weekend as any)?.mode ||
                  ((settings?.payRules?.weekend as any)?.type === "percentage"
                    ? "multiplier"
                    : (settings?.payRules?.weekend as any)?.type === "fixed"
                    ? "fixed"
                    : "multiplier")
                }
                onChange={(v) =>
                  updatePayRules({
                    weekend: {
                      ...(settings?.payRules?.weekend || {}),
                      mode: v as any,
                    },
                  })
                }
                items={[
                  { value: "multiplier", label: "Multiplier" },
                  { value: "fixed", label: "Fixed uplift" },
                ]}
              />
              <TextInput
                placeholder="Value"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={weekendValueText}
                onChangeText={setWeekendValueText}
                onEndEditing={() => {
                  let n = parseFloat(weekendValueText || "0");
                  if (Number.isNaN(n)) n = 0;
                  const mode =
                    (settings?.payRules?.weekend as any)?.mode || "multiplier";
                  updatePayRules({
                    weekend: {
                      ...(settings?.payRules?.weekend || {}),
                      [mode === "multiplier" ? "multiplier" : "uplift"]: n,
                    },
                  });
                  setWeekendValueText(String(n));
                }}
                style={[
                  styles.input,
                  styles.flex1,
                  { color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: colors.primary }]}
              onPress={() => setShowWeekendSheet(false)}
            >
              <ThemedText style={{ color: colors.primary }}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preferences: Main */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            display: activeSettingsTab === "preferences" ? "flex" : "none",
          },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Preferences
        </ThemedText>
        <ThemedText
          style={[styles.subsectionTitle, { color: colors.textSecondary }]}
        >
          Dark mode
        </ThemedText>
        <View style={[styles.toggleRow, { marginTop: 4 }]}>
          <ThemedText style={{ flex: 1, color: colors.text }}>
            Enable dark mode
          </ThemedText>
          <Switch
            value={themeMode === "dark"}
            onValueChange={(val) => setThemeMode(val ? "dark" : "light")}
          />
        </View>
        <View
          style={[styles.inlineInputs, { flexWrap: "wrap", marginTop: 12 }]}
        >
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
        {/* Advanced options moved to Advanced tab */}

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
                  let n = parseFloat(weeklyGoalText || "");
                  if (Number.isNaN(n)) n = 0;
                  n = Math.max(0, n);
                  setWeeklyGoalText(String(n));
                  const next = await settingsService.setPreferences({
                    weeklyGoal: n,
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
                  let n = parseFloat(monthlyGoalText || "");
                  if (Number.isNaN(n)) n = 0;
                  n = Math.max(0, n);
                  setMonthlyGoalText(String(n));
                  const next = await settingsService.setPreferences({
                    monthlyGoal: n,
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

      {/* Advanced: Account */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            display: activeSettingsTab === "advanced" ? "flex" : "none",
          },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Advanced
        </ThemedText>

        {/* Stacking toggle moved here */}
        <View style={[styles.toggleRow, { marginTop: 4 }]}>
          <ThemedText style={{ flex: 1, color: colors.text }}>
            Stacking (apply Night/Weekend on top of Base/OT)
          </ThemedText>
          <Switch
            value={(settings?.preferences?.stackingRule || "stack") === "stack"}
            onValueChange={(val) =>
              updatePreferences({
                stackingRule: val ? "stack" : "highestOnly",
              })
            }
          />
        </View>
      </View>

      {/* Advanced: Account */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            display: activeSettingsTab === "advanced" ? "flex" : "none",
          },
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

      {/* Advanced: About */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            display: activeSettingsTab === "advanced" ? "flex" : "none",
          },
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
  simpleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    marginBottom: 4,
  },
  modalButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
