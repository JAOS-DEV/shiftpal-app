import { getFirebase } from "@/lib/firebase";
import {
  AllowanceItem,
  AppSettings,
  HoursAndMinutes,
  NotificationsPrefs,
  PayBreakdown,
  PayCalculationEntry,
  PayCalculationInput,
  PayRate,
  PayRules,
  Preferences,
} from "@/types/settings";
import { timeToMinutes } from "@/utils/timeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { shiftService } from "./shiftService";

const SETTINGS_KEY = "shiftpal.settings";
const PAY_HISTORY_KEY = "shiftpal.pay_history";

// Generate user-specific storage keys
function getUserSettingsKey(userId?: string): string {
  return userId ? `shiftpal.settings.${userId}` : "shiftpal.settings";
}

function getUserPayHistoryKey(userId?: string): string {
  return userId ? `shiftpal.pay_history.${userId}` : "shiftpal.pay_history";
}

function getUserId(): string | undefined {
  try {
    const { auth } = getFirebase();
    return auth.currentUser?.uid;
  } catch {
    return undefined;
  }
}

function now(): number {
  return Date.now();
}

function defaultSettings(): AppSettings {
  return {
    payRates: [],
    payRules: {
      // Leave overtime values empty by default; user opts-in
      overtime: {},
      // Default weekend days, but no uplift/multiplier by default
      weekend: { days: ["Sat", "Sun"] },
      allowances: [],
      payPeriod: { cycle: "weekly", startDay: "Monday" },
    },
    preferences: {
      currency: "GBP",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      stackingRule: "stack",
      weeklyGoal: 0,
      monthlyGoal: 0,
    },
    notifications: {
      remindSubmitShifts: true,
      remindCheckPay: true,
    },
  };
}

class SettingsService {
  // Simple in-memory listeners so other screens can react immediately to changes
  private settingsListeners = new Set<(s: AppSettings) => void>();
  // In-memory cache to avoid async races across rapid updates (especially on iOS)
  private cachedSettings: AppSettings | null = null;
  // Track current user to detect user changes
  private currentUserId: string | null = null;

  subscribe(listener: (s: AppSettings) => void): () => void {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }

  private notifySettingsChanged(next: AppSettings) {
    for (const cb of this.settingsListeners) {
      try {
        cb(next);
      } catch {}
    }
  }
  async getSettings(): Promise<AppSettings> {
    const userId = getUserId();

    // Check if user has changed - clear cache if so
    if (this.currentUserId !== userId) {
      this.cachedSettings = null;
      this.currentUserId = userId ?? null;
    }

    // Serve from cache if present
    if (this.cachedSettings) return this.cachedSettings;

    // Try Firebase first
    try {
      if (userId) {
        const { firestore } = getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");
        const ref = doc(firestore, "users", userId, "config", "settings");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as AppSettings;
          const userSettingsKey = getUserSettingsKey(userId);
          await AsyncStorage.setItem(userSettingsKey, JSON.stringify(data));
          const norm = this.normalizeSettings(data);
          this.cachedSettings = norm;
          return norm;
        }
      }
    } catch {}

    // Fallback to local
    const userSettingsKey = getUserSettingsKey(userId);
    const local = await AsyncStorage.getItem(userSettingsKey);
    if (local) {
      const norm = this.normalizeSettings(JSON.parse(local));
      this.cachedSettings = norm;
      return norm;
    }
    const defaults = defaultSettings();
    await AsyncStorage.setItem(userSettingsKey, JSON.stringify(defaults));
    this.cachedSettings = defaults;
    return defaults;
  }

  private normalizeSettings(input: any): AppSettings {
    const base = defaultSettings();
    const merged: AppSettings = {
      ...base,
      ...input,
      payRates: Array.isArray(input?.payRates)
        ? input.payRates.map((r: any) => ({
            id: String(r.id ?? Math.random().toString(36).slice(2)),
            label: String(r.label ?? "Rate"),
            value: Number(r.value ?? 0),
            type: (r.type as PayRate["type"]) ?? "base",
            createdAt: Number(r.createdAt ?? now()),
            updatedAt: Number(r.updatedAt ?? now()),
          }))
        : [],
      payRules: { ...base.payRules, ...(input?.payRules || {}) },
      preferences: { ...base.preferences, ...(input?.preferences || {}) },
      notifications: { ...base.notifications, ...(input?.notifications || {}) },
    };
    // Migrate legacy overtime fields to new nested structure (non-destructive)
    try {
      const ot = (merged.payRules?.overtime || {}) as PayRules["overtime"];
      const nextOvertime: any = { ...ot };
      if (typeof nextOvertime.enabled !== "boolean")
        nextOvertime.enabled = false;
      // Daily
      if (!nextOvertime.daily) {
        const legacyDailyThreshold = (ot as any)?.dailyThreshold;
        const legacyDailyMultiplier = (ot as any)?.dailyMultiplier;
        if (
          typeof legacyDailyThreshold === "number" ||
          typeof legacyDailyMultiplier === "number"
        ) {
          nextOvertime.daily = {
            threshold:
              typeof legacyDailyThreshold === "number"
                ? legacyDailyThreshold
                : undefined,
            mode:
              typeof legacyDailyMultiplier === "number"
                ? ("multiplier" as const)
                : undefined,
            multiplier:
              typeof legacyDailyMultiplier === "number"
                ? legacyDailyMultiplier
                : undefined,
          };
        }
      }
      // Weekly
      if (!nextOvertime.weekly) {
        const legacyWeeklyThreshold = (ot as any)?.weeklyThreshold;
        const legacyWeeklyMultiplier = (ot as any)?.weeklyMultiplier;
        if (
          typeof legacyWeeklyThreshold === "number" ||
          typeof legacyWeeklyMultiplier === "number"
        ) {
          nextOvertime.weekly = {
            threshold:
              typeof legacyWeeklyThreshold === "number"
                ? legacyWeeklyThreshold
                : undefined,
            mode:
              typeof legacyWeeklyMultiplier === "number"
                ? ("multiplier" as const)
                : undefined,
            multiplier:
              typeof legacyWeeklyMultiplier === "number"
                ? legacyWeeklyMultiplier
                : undefined,
          };
        }
      }
      merged.payRules = {
        ...merged.payRules,
        overtime: nextOvertime,
      } as PayRules;
    } catch {}

    // Migrate legacy weekend fields (type/value) to new mode/multiplier/uplift
    try {
      const wk = (merged.payRules?.weekend || {}) as PayRules["weekend"] & {
        type?: "percentage" | "fixed";
        value?: number;
      };
      const nextWeekend: any = { ...wk };
      if (typeof nextWeekend.enabled !== "boolean") nextWeekend.enabled = false;
      if (!nextWeekend.mode && (wk.type || typeof wk.value === "number")) {
        if (wk.type === "percentage") {
          nextWeekend.mode = "multiplier" as const;
          nextWeekend.multiplier =
            typeof wk.value === "number" ? 1 + wk.value / 100 : undefined;
        } else if (wk.type === "fixed") {
          nextWeekend.mode = "fixed" as const;
          nextWeekend.uplift =
            typeof wk.value === "number" ? wk.value : undefined;
        }
      }
      merged.payRules = {
        ...merged.payRules,
        weekend: nextWeekend,
      } as PayRules;
    } catch {}
    // Night default enabled=false unless configured
    try {
      const night = (merged.payRules?.night || {}) as PayRules["night"];
      const nextNight: any = { ...night };
      if (typeof nextNight.enabled !== "boolean") nextNight.enabled = false;
      merged.payRules = { ...merged.payRules, night: nextNight } as PayRules;
    } catch {}
    return merged;
  }

  private simpleHash(input: string): string {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    // to unsigned 32-bit and base36
    return (h >>> 0).toString(36);
  }

  async saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const next: AppSettings = this.normalizeSettings({
      ...current,
      ...partial,
    });
    // Update cache immediately to avoid toggle race conditions
    this.cachedSettings = next;
    const userId = getUserId();
    const userSettingsKey = getUserSettingsKey(userId);
    await AsyncStorage.setItem(userSettingsKey, JSON.stringify(next));
    // Best-effort sync
    try {
      if (userId) {
        const { firestore } = getFirebase();
        const { doc, setDoc } = await import("firebase/firestore");
        const ref = doc(firestore, "users", userId, "config", "settings");
        await setDoc(ref, next, { merge: true });
      }
    } catch {}
    // Notify listeners so active screens can refresh immediately
    this.notifySettingsChanged(next);
    return next;
  }

  // Pay Rates CRUD
  async addPayRate(
    rate: Omit<PayRate, "id" | "createdAt" | "updatedAt">
  ): Promise<PayRate> {
    const settings = await this.getSettings();
    const newRate: PayRate = {
      ...rate,
      id: now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: now(),
      updatedAt: now(),
    };
    const next = { ...settings, payRates: [newRate, ...settings.payRates] };
    await this.saveSettings(next);
    return newRate;
  }

  async updatePayRate(
    rateId: string,
    updates: Partial<PayRate>
  ): Promise<PayRate | null> {
    const settings = await this.getSettings();
    const idx = settings.payRates.findIndex((r) => r.id === rateId);
    if (idx === -1) return null;
    const updated: PayRate = {
      ...settings.payRates[idx],
      ...updates,
      id: settings.payRates[idx].id,
      updatedAt: now(),
    };
    const nextRates = [...settings.payRates];
    nextRates[idx] = updated;
    await this.saveSettings({ ...settings, payRates: nextRates });
    return updated;
  }

  async deletePayRate(rateId: string): Promise<void> {
    const settings = await this.getSettings();
    const nextRates = settings.payRates.filter((r) => r.id !== rateId);
    await this.saveSettings({ ...settings, payRates: nextRates });
  }

  // Preferences/Rules convenience setters
  async setPreferences(prefs: Partial<Preferences>): Promise<AppSettings> {
    const settings = await this.getSettings();
    return this.saveSettings({
      ...settings,
      preferences: { ...settings.preferences, ...prefs },
    });
  }

  async setPayRules(rules: Partial<PayRules>): Promise<AppSettings> {
    const settings = await this.getSettings();
    return this.saveSettings({
      ...settings,
      payRules: { ...settings.payRules, ...rules },
    });
  }

  async setNotificationsPrefs(
    prefs: Partial<NotificationsPrefs>
  ): Promise<AppSettings> {
    const settings = await this.getSettings();
    return this.saveSettings({
      ...settings,
      notifications: { ...settings.notifications, ...prefs },
    });
  }

  // Calculation helpers
  private toHours(hm: HoursAndMinutes): number {
    const minutes = Math.max(0, (hm?.hours ?? 0) * 60 + (hm?.minutes ?? 0));
    return minutes / 60;
  }

  computePay(input: PayCalculationInput, settings: AppSettings): PayBreakdown {
    const prefs = settings.preferences;
    const overtimeRules = settings.payRules?.overtime;
    const weekendRules = settings.payRules?.weekend as any;

    // Resolve rates
    const baseRate = settings.payRates.find(
      (r) => r.id === input.hourlyRateId && r.type !== "overtime"
    );
    const overtimeRate =
      settings.payRates.find(
        (r) => r.id === input.overtimeRateId && r.type !== "base"
      ) || baseRate;

    const baseHoursRaw = this.toHours(input.hoursWorked);
    const overtimeHoursRaw = this.toHours(input.overtimeWorked);
    const nightHoursRaw = this.toHours(
      input.nightHours || { hours: 0, minutes: 0 }
    );

    // Prepare base and overtime hours; allow tracker auto-split to override later
    let baseHours = baseHoursRaw;
    let overtimeHours = overtimeHoursRaw;

    // Use minute precision: do not round hours
    const nightHours = nightHoursRaw;

    // Determine per-hour rates considering overtime model and weekend uplift
    const basePerHour = this.applyWeekendToRate(
      baseRate?.value ?? 0,
      input.date,
      weekendRules,
      /* stackingWithOther */ false
    );

    // Choose overtime tier by explicit basis when set; else preserve legacy preference
    const activeBasis = (overtimeRules as any)?.active as
      | "daily"
      | "weekly"
      | undefined;
    const hasDailyRule = Boolean((overtimeRules as any)?.daily?.mode);
    const hasWeeklyRule = Boolean((overtimeRules as any)?.weekly?.mode);
    let selectedTier: any = undefined;
    if ((overtimeRules as any)?.enabled === false) {
      selectedTier = undefined;
    } else if (activeBasis === "daily" && hasDailyRule) {
      selectedTier = (overtimeRules as any)?.daily;
    } else if (activeBasis === "weekly" && hasWeeklyRule) {
      selectedTier = (overtimeRules as any)?.weekly;
    } else {
      // Legacy heuristic: prefer daily if we trimmed base via daily threshold, otherwise weekly
      const useDailyRule =
        hasDailyRule && baseHoursRaw > 0 && baseHours < baseHoursRaw;
      selectedTier = useDailyRule
        ? (overtimeRules as any)?.daily
        : (overtimeRules as any)?.weekly;
    }

    let overtimePerHourBase = overtimeRate?.value ?? baseRate?.value ?? 0;
    if (
      selectedTier?.mode === "multiplier" &&
      typeof selectedTier?.multiplier === "number"
    ) {
      overtimePerHourBase = (baseRate?.value ?? 0) * selectedTier.multiplier;
    } else if (
      selectedTier?.mode === "fixed" &&
      typeof selectedTier?.uplift === "number"
    ) {
      overtimePerHourBase = (baseRate?.value ?? 0) + selectedTier.uplift;
    }

    // Apply weekend stacking vs highestOnly
    const stacking = prefs.stackingRule || "stack";
    const weekendAppliedToBase = this.applyWeekendToRate(
      baseRate?.value ?? 0,
      input.date,
      weekendRules,
      false
    );
    const overtimeOnlyRate = overtimePerHourBase;
    const weekendOnlyRate = weekendAppliedToBase;
    let overtimePerHour = overtimeOnlyRate;
    if (this.isWeekendDate(input.date, weekendRules)) {
      if (stacking === "stack") {
        overtimePerHour = this.applyWeekendToRate(
          overtimeOnlyRate,
          input.date,
          weekendRules,
          true
        );
      } else {
        overtimePerHour = Math.max(overtimeOnlyRate, weekendOnlyRate);
      }
    }

    let basePay = basePerHour * baseHours;
    let overtimePay = overtimePerHour * overtimeHours;

    // Night uplift: apply to all night hours (simplified - always applies)
    const nightRules = settings.payRules?.night;
    let nightUplift = 0;
    if (nightRules && nightRules?.enabled === true && nightHours > 0) {
      // Compute night uplift per-hour relative to base rate
      const nightUpliftPerHour = (() => {
        const mode = nightRules.mode || "fixed";
        if (
          mode === "multiplier" &&
          typeof nightRules.multiplier === "number"
        ) {
          return (baseRate?.value ?? 0) * (nightRules.multiplier - 1);
        }
        if (mode === "fixed" && typeof nightRules.uplift === "number") {
          return nightRules.uplift;
        }
        return 0;
      })();
      if (nightUpliftPerHour > 0) {
        // Apply night uplift to all night hours (no stacking rule consideration)
        nightUplift = nightUpliftPerHour * nightHours;
      }
    }

    // Calculate Weekend uplift separately
    let weekendUplift = 0;
    if (
      this.isWeekendDate(input.date, weekendRules) &&
      weekendRules?.enabled === true
    ) {
      const weekendUpliftPerHour = (() => {
        const mode = weekendRules.mode || "multiplier";
        if (
          mode === "multiplier" &&
          typeof weekendRules.multiplier === "number"
        ) {
          return (baseRate?.value ?? 0) * (weekendRules.multiplier - 1);
        }
        if (mode === "fixed" && typeof weekendRules.uplift === "number") {
          return weekendRules.uplift;
        }
        return 0;
      })();

      if (weekendUpliftPerHour > 0) {
        // Apply weekend uplift to all hours (base + overtime)
        weekendUplift = weekendUpliftPerHour * (baseHours + overtimeHours);
      }
    }

    // Uplifts (night + weekend) and allowances
    const uplifts = nightUplift + weekendUplift;
    const allowances = this.computeAllowances(
      settings.payRules?.allowances || [],
      baseHours + overtimeHours
    );

    const gross = basePay + overtimePay + uplifts + allowances;

    // Simple Tax/NI implementation (flat percentage with optional thresholds/allowances)
    const taxRules = settings.payRules?.tax;
    const niRules = settings.payRules?.ni;

    let tax = 0;
    if (taxRules?.enabled) {
      let taxableBase = gross;
      if (typeof taxRules?.personalAllowance === "number") {
        taxableBase = Math.max(0, taxableBase - taxRules.personalAllowance);
      }
      const taxPct =
        typeof taxRules?.percentage === "number" ? taxRules.percentage : 0;
      tax = (taxPct / 100) * taxableBase;
    }

    let ni = 0;
    if (niRules?.enabled) {
      let niBase = gross;
      if (typeof niRules?.threshold === "number") {
        niBase = Math.max(0, niBase - niRules.threshold);
      }
      const niPct =
        typeof niRules?.percentage === "number" ? niRules.percentage : 0;
      ni = (niPct / 100) * niBase;
    }

    const total = gross - tax - ni;
    return {
      base: this.toMoney(basePay),
      overtime: this.toMoney(overtimePay),
      uplifts: this.toMoney(uplifts),
      nightUplift: this.toMoney(nightUplift),
      weekendUplift: this.toMoney(weekendUplift),
      allowances: this.toMoney(allowances),
      gross: this.toMoney(gross),
      tax: this.toMoney(tax),
      ni: this.toMoney(ni),
      total: this.toMoney(total),
    };
  }

  /**
   * Derive base vs overtime allocation for a date in tracker mode
   * Uses the active overtime basis (daily/weekly) and thresholds
   */
  async deriveTrackerOvertimeSplitForDate(
    date: string,
    settings: AppSettings
  ): Promise<{ base: HoursAndMinutes; overtime: HoursAndMinutes }> {
    // Check if overtime rules are enabled
    const ot = settings?.payRules?.overtime;
    if (!ot || ot.enabled === false) {
      // If overtime is disabled, return all hours as base (no overtime)
      // Include both submitted and unsubmitted shifts for tracker mode
      const unsubmitted = await shiftService.getShiftsForDate(date);

      // Get submitted shifts for the same date
      let submittedShifts: Array<{
        start: string;
        end: string;
        durationMinutes?: number;
      }> = [];
      try {
        const submittedDays = await shiftService.getSubmittedDays({
          type: "all",
        });
        const dayData = submittedDays.find((d) => d.date === date);
        if (dayData && dayData.submissions) {
          // Flatten all submissions for this day
          submittedShifts = dayData.submissions.flatMap((submission) =>
            submission.shifts.map((shift) => ({
              start: shift.start,
              end: shift.end,
              durationMinutes: shift.durationMinutes,
            }))
          );
        }
      } catch {
        // If we can't get submitted days, just use unsubmitted
      }

      const allShifts = [...unsubmitted, ...submittedShifts] as any;
      const totalMinutes = allShifts.reduce(
        (sum: number, sh: any) => sum + (sh.durationMinutes ?? 0),
        0
      );
      return {
        base: {
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        },
        overtime: { hours: 0, minutes: 0 },
      };
    }

    // Check if pay calculation already exists for this date
    const hasCalculation = await this.hasPayCalculationForDate(date);
    if (hasCalculation) {
      // If pay has already been calculated for this date, return 0 hours
      // to prevent double-counting
      return {
        base: { hours: 0, minutes: 0 },
        overtime: { hours: 0, minutes: 0 },
      };
    }

    // Include both submitted and unsubmitted shifts for tracker mode
    // This allows users to calculate pay for all their hours for the day

    // Get unsubmitted shifts
    const unsubmitted = await shiftService.getShiftsForDate(date);

    // Get submitted shifts for the same date
    let submittedShifts: Array<{
      start: string;
      end: string;
      durationMinutes?: number;
    }> = [];
    try {
      const submittedDays = await shiftService.getSubmittedDays({
        type: "all",
      });
      const dayData = submittedDays.find((d) => d.date === date);
      if (dayData && dayData.submissions) {
        // Flatten all submissions for this day
        submittedShifts = dayData.submissions.flatMap((submission) =>
          submission.shifts.map((shift) => ({
            start: shift.start,
            end: shift.end,
            durationMinutes: shift.durationMinutes,
          }))
        );
      }
    } catch {
      // If we can't get submitted days, just use unsubmitted
    }

    const allShifts = [...unsubmitted, ...submittedShifts] as any;

    const totalMinutes = allShifts.reduce(
      (sum: number, sh: any) => sum + (sh.durationMinutes ?? 0),
      0
    );
    if (totalMinutes <= 0) {
      return {
        base: { hours: 0, minutes: 0 },
        overtime: { hours: 0, minutes: 0 },
      };
    }

    // Determine base vs overtime minutes for the date according to active basis
    // (ot is already declared above)
    const active = ot?.active as "daily" | "weekly" | undefined;
    let baseMinutes = totalMinutes;
    let otMinutes = 0;

    // Check new nested structure first
    if (active === "daily" && typeof ot?.daily?.threshold === "number") {
      const thresholdMin = Math.max(0, ot.daily.threshold * 60);
      baseMinutes = Math.min(totalMinutes, thresholdMin);
      otMinutes = Math.max(0, totalMinutes - baseMinutes);
    } else if (
      active === "weekly" &&
      typeof ot?.weekly?.threshold === "number"
    ) {
      const thresholdMin = Math.max(0, ot.weekly.threshold * 60);
      const startDay = settings?.payRules?.payPeriod?.startDay || "Monday";
      const weekInfo = await this.getWeekRange(date, startDay);
      // Sum minutes before the given date in the same week
      let prevMinutes = 0;
      try {
        const days = await shiftService.getSubmittedDays({ type: "all" });
        for (const d of days) {
          if (d.date >= weekInfo.start && d.date < date) {
            prevMinutes += Math.max(0, d.totalMinutes || 0);
          }
        }
      } catch {}
      if (prevMinutes >= thresholdMin) {
        baseMinutes = 0;
        otMinutes = totalMinutes;
      } else if (prevMinutes + totalMinutes <= thresholdMin) {
        baseMinutes = totalMinutes;
        otMinutes = 0;
      } else {
        baseMinutes = thresholdMin - prevMinutes;
        otMinutes = Math.max(0, totalMinutes - baseMinutes);
      }
    }

    // Fallback: If active is undefined but we have daily rules, use them
    if (
      otMinutes === 0 &&
      baseMinutes === totalMinutes &&
      !active &&
      typeof ot?.daily?.threshold === "number"
    ) {
      const thresholdMin = Math.max(0, ot.daily.threshold * 60);
      baseMinutes = Math.min(totalMinutes, thresholdMin);
      otMinutes = Math.max(0, totalMinutes - baseMinutes);

      // Auto-fix: Set active to "daily" if it's undefined but daily rules exist
      try {
        await this.setPayRules({
          overtime: {
            ...ot,
            active: "daily",
          } as any,
        });
      } catch (error) {}
    }

    // Fallback to legacy fields if new structure not found
    if (otMinutes === 0 && baseMinutes === totalMinutes) {
      if (typeof ot.dailyThreshold === "number") {
        const thresholdMin = Math.max(0, ot.dailyThreshold * 60);
        baseMinutes = Math.min(totalMinutes, thresholdMin);
        otMinutes = Math.max(0, totalMinutes - baseMinutes);
      } else if (typeof ot.weeklyThreshold === "number") {
        const thresholdMin = Math.max(0, ot.weeklyThreshold * 60);
        const startDay = settings?.payRules?.payPeriod?.startDay || "Monday";
        const weekInfo = await this.getWeekRange(date, startDay);
        // Sum minutes before the given date in the same week
        let prevMinutes = 0;
        try {
          const days = await shiftService.getSubmittedDays({ type: "all" });
          for (const d of days) {
            if (d.date >= weekInfo.start && d.date < date) {
              prevMinutes += Math.max(0, d.totalMinutes || 0);
            }
          }
        } catch {}
        if (prevMinutes >= thresholdMin) {
          baseMinutes = 0;
          otMinutes = totalMinutes;
        } else if (prevMinutes + totalMinutes <= thresholdMin) {
          baseMinutes = totalMinutes;
          otMinutes = 0;
        } else {
          baseMinutes = thresholdMin - prevMinutes;
          otMinutes = Math.max(0, totalMinutes - baseMinutes);
        }
      }
    }

    return {
      base: { hours: Math.floor(baseMinutes / 60), minutes: baseMinutes % 60 },
      overtime: { hours: Math.floor(otMinutes / 60), minutes: otMinutes % 60 },
    };
  }

  private isWeekendDate(date: string, weekendRules: any): boolean {
    // Validate inputs
    if (!date || typeof date !== "string") {
      console.warn("Invalid date format:", date);
      return false;
    }

    if (!weekendRules || !weekendRules.days) {
      return false;
    }

    try {
      const d = new Date(date + "T00:00:00");
      if (isNaN(d.getTime())) {
        console.warn("Invalid date:", date);
        return false;
      }

      const day = d.getDay(); // 0=Sun,6=Sat
      const days: string[] = Array.isArray(weekendRules?.days)
        ? weekendRules.days
        : ["Sat", "Sun"];
      const map: Record<number, string> = { 0: "Sun", 6: "Sat" };
      return days.includes(map[day]);
    } catch (error) {
      console.warn("Error checking weekend date:", error);
      return false;
    }
  }

  private applyWeekendToRate(
    rate: number,
    date: string,
    weekendRules: any,
    stackingWithOther: boolean
  ): number {
    // Weekend uplift is now calculated separately as an uplift line item
    // Return the original rate without applying weekend uplift
    return rate;
  }

  private computeAllowances(
    allowances: AllowanceItem[],
    hours: number
  ): number {
    return allowances.reduce((sum, a) => {
      if (a.unit === "perShift") return sum + a.value;
      if (a.unit === "perHour") return sum + a.value * hours;
      if (a.unit === "perDay") return sum + a.value; // Per day is treated as per shift for now
      return sum;
    }, 0);
  }

  private toMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async savePayCalculation(entry: PayCalculationEntry): Promise<void> {
    // Check if pay calculation already exists for this date
    const hasExisting = await this.hasPayCalculationForDate(entry.input.date);
    if (hasExisting) {
      throw new Error(
        `Pay calculation already exists for ${entry.input.date}. Please delete the existing calculation first.`
      );
    }

    const userId = getUserId();
    const userPayHistoryKey = getUserPayHistoryKey(userId);
    const data = (await AsyncStorage.getItem(userPayHistoryKey)) || "[]";
    const list: PayCalculationEntry[] = JSON.parse(data);
    list.unshift(entry);
    await AsyncStorage.setItem(userPayHistoryKey, JSON.stringify(list));
    // Best-effort sync to Firebase
    try {
      if (userId) {
        const { firestore } = getFirebase();
        const { collection, addDoc } = await import("firebase/firestore");
        const col = collection(firestore, "users", userId, "payHistory");
        await addDoc(col, { ...entry, userId });
      }
    } catch {}
  }

  async getPayHistory(): Promise<PayCalculationEntry[]> {
    try {
      const userId = getUserId();
      const userPayHistoryKey = getUserPayHistoryKey(userId);
      const local = await AsyncStorage.getItem(userPayHistoryKey);
      const list: PayCalculationEntry[] = local ? JSON.parse(local) : [];
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Check if pay calculation already exists for a specific date
   */
  async hasPayCalculationForDate(date: string): Promise<boolean> {
    try {
      const payHistory = await this.getPayHistory();
      return payHistory.some((entry) => entry.input.date === date);
    } catch {
      return false;
    }
  }

  /**
   * Get the total hours that have already been calculated and saved to pay history for a date
   */
  async getCalculatedHoursForDate(
    date: string
  ): Promise<{ base: HoursAndMinutes; overtime: HoursAndMinutes }> {
    try {
      const payHistory = await this.getPayHistory();
      const entry = payHistory.find((e) => e.input.date === date);
      if (!entry) {
        return {
          base: { hours: 0, minutes: 0 },
          overtime: { hours: 0, minutes: 0 },
        };
      }
      return {
        base: entry.input.hoursWorked,
        overtime: entry.input.overtimeWorked,
      };
    } catch {
      return {
        base: { hours: 0, minutes: 0 },
        overtime: { hours: 0, minutes: 0 },
      };
    }
  }

  async deletePayCalculation(entryId: string): Promise<void> {
    try {
      const userId = getUserId();
      const userPayHistoryKey = getUserPayHistoryKey(userId);
      const local = (await AsyncStorage.getItem(userPayHistoryKey)) || "[]";
      const list: PayCalculationEntry[] = JSON.parse(local);
      const next = list.filter((e) => e.id !== entryId);
      await AsyncStorage.setItem(userPayHistoryKey, JSON.stringify(next));
    } catch {}
  }

  async clearPayHistory(): Promise<void> {
    try {
      const userId = getUserId();
      const userPayHistoryKey = getUserPayHistoryKey(userId);
      await AsyncStorage.setItem(userPayHistoryKey, JSON.stringify([]));
    } catch {}
  }

  // Clear all cached data for the current user
  async clearUserData(): Promise<void> {
    try {
      // Clear in-memory cache
      this.cachedSettings = null;
      this.currentUserId = null;

      // Clear user-specific AsyncStorage data
      const userId = getUserId();
      if (userId) {
        const userSettingsKey = getUserSettingsKey(userId);
        const userPayHistoryKey = getUserPayHistoryKey(userId);
        await AsyncStorage.removeItem(userSettingsKey);
        await AsyncStorage.removeItem(userPayHistoryKey);
      }

      // Also clear legacy global keys for backward compatibility
      await AsyncStorage.removeItem(SETTINGS_KEY);
      await AsyncStorage.removeItem(PAY_HISTORY_KEY);

      // Clear rate preference keys that persist across sessions
      await AsyncStorage.removeItem("shiftpal.preferences.last_base_rate_id");
      await AsyncStorage.removeItem(
        "shiftpal.preferences.last_overtime_rate_id"
      );

      // Clear UI preference keys
      await AsyncStorage.removeItem("shiftpal.ui.active_tab");

      // Clear input mode and time preference keys
      await AsyncStorage.removeItem("shiftpal.preferences.input_mode");
      await AsyncStorage.removeItem("shiftpal.preferences.include_breaks");
      await AsyncStorage.removeItem("shiftpal.preferences.manual_start_time");
      await AsyncStorage.removeItem("shiftpal.preferences.manual_end_time");

      // Clear theme preference
      await AsyncStorage.removeItem("theme_mode");
    } catch {}
  }

  async deriveTrackerHoursForDate(date: string): Promise<HoursAndMinutes> {
    // Check if pay calculation already exists for this date
    const hasCalculation = await this.hasPayCalculationForDate(date);
    if (hasCalculation) {
      // If pay has already been calculated for this date, return 0 hours
      // to prevent double-counting
      return { hours: 0, minutes: 0 };
    }

    // Include both submitted and unsubmitted hours for tracker mode
    // This allows users to calculate pay for all their hours for the day

    // Get unsubmitted shifts
    const unsubmittedShifts = await shiftService.getShiftsForDate(date);
    const unsubmittedMinutes =
      shiftService.calculateDayTotal(unsubmittedShifts).totalMinutes;

    // Get submitted shifts for the same date
    let submittedMinutes = 0;
    try {
      const submittedDays = await shiftService.getSubmittedDays({
        type: "all",
      });
      const dayData = submittedDays.find((d) => d.date === date);
      if (dayData) {
        submittedMinutes = dayData.totalMinutes || 0;
      }
    } catch {
      // If we can't get submitted days, just use unsubmitted
    }

    const totalMinutes = Math.max(0, unsubmittedMinutes + submittedMinutes);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  }

  /**
   * Derive night allocation for a date in tracker mode using recorded shifts
   * Night minutes are allocated chronologically: minutes after the base threshold count as OT night
   */
  async deriveTrackerNightAllocationForDate(
    date: string,
    settings: AppSettings
  ): Promise<{ nightBase: HoursAndMinutes; nightOvertime: HoursAndMinutes }> {
    const night = settings?.payRules?.night;
    if (!night || night.enabled !== true || (!night.start && !night.end)) {
      return {
        nightBase: { hours: 0, minutes: 0 },
        nightOvertime: { hours: 0, minutes: 0 },
      };
    }

    // Check if pay calculation already exists for this date
    const hasCalculation = await this.hasPayCalculationForDate(date);
    if (hasCalculation) {
      // If pay has already been calculated for this date, return 0 hours
      // to prevent double-counting
      return {
        nightBase: { hours: 0, minutes: 0 },
        nightOvertime: { hours: 0, minutes: 0 },
      };
    }

    // Include both submitted and unsubmitted shifts for tracker mode
    // This allows users to calculate pay for all their hours for the day

    // Get unsubmitted shifts
    const unsubmitted = await shiftService.getShiftsForDate(date);

    // Get submitted shifts for the same date
    let submittedShifts: Array<{
      start: string;
      end: string;
      durationMinutes?: number;
    }> = [];
    try {
      const submittedDays = await shiftService.getSubmittedDays({
        type: "all",
      });
      const dayData = submittedDays.find((d) => d.date === date);
      if (dayData && dayData.submissions) {
        // Flatten all submissions for this day
        submittedShifts = dayData.submissions.flatMap((submission) =>
          submission.shifts.map((shift) => ({
            start: shift.start,
            end: shift.end,
            durationMinutes: shift.durationMinutes,
          }))
        );
      }
    } catch {
      // If we can't get submitted days, just use unsubmitted
    }

    const allShifts = [...unsubmitted, ...submittedShifts] as any;

    const totalMinutes = allShifts.reduce(
      (sum: number, sh: any) => sum + (sh.durationMinutes ?? 0),
      0
    );
    if (totalMinutes <= 0) {
      return {
        nightBase: { hours: 0, minutes: 0 },
        nightOvertime: { hours: 0, minutes: 0 },
      };
    }

    // Compute night window minutes overlapped by shifts
    const ns = typeof night.start === "string" ? timeToMinutes(night.start) : 0;
    const ne = typeof night.end === "string" ? timeToMinutes(night.end) : 0;

    // Validate night time range
    if (ns < 0 || ns >= 1440 || ne < 0 || ne >= 1440) {
      console.warn("Invalid night time range:", {
        start: night.start,
        end: night.end,
      });
      return {
        nightBase: { hours: 0, minutes: 0 },
        nightOvertime: { hours: 0, minutes: 0 },
      };
    }
    const nightMinutes = allShifts.reduce(
      (sum: number, sh: any) =>
        sum + this.overlapWithNight(sh.start, sh.end, ns, ne),
      0
    );

    // Determine base vs overtime minutes for the date according to active basis
    const ot = settings?.payRules?.overtime as any;
    const active = ot?.active as "daily" | "weekly" | undefined;
    let baseMinutes = totalMinutes;
    let otMinutes = 0;
    if (active === "daily" && typeof ot?.daily?.threshold === "number") {
      const thresholdMin = Math.max(0, ot.daily.threshold * 60);
      baseMinutes = Math.min(totalMinutes, thresholdMin);
      otMinutes = Math.max(0, totalMinutes - baseMinutes);
    } else if (
      active === "weekly" &&
      typeof ot?.weekly?.threshold === "number"
    ) {
      // Compute previous minutes in the pay week before this date
      const thresholdMin = Math.max(0, ot.weekly.threshold * 60);
      const startDay = settings?.payRules?.payPeriod?.startDay || "Monday";
      const weekInfo = await this.getWeekRange(date, startDay);
      // Sum minutes before the given date
      let prevMinutes = 0;
      try {
        const days = await shiftService.getSubmittedDays({ type: "all" });
        for (const d of days) {
          if (d.date >= weekInfo.start && d.date < date) {
            prevMinutes += Math.max(0, d.totalMinutes || 0);
          }
        }
      } catch {}
      // Add unsubmitted for previous days? unavailable offline; we ignore
      if (prevMinutes >= thresholdMin) {
        baseMinutes = 0;
        otMinutes = totalMinutes;
      } else if (prevMinutes + totalMinutes <= thresholdMin) {
        baseMinutes = totalMinutes;
        otMinutes = 0;
      } else {
        baseMinutes = thresholdMin - prevMinutes;
        otMinutes = Math.max(0, totalMinutes - baseMinutes);
      }
    }

    if (nightMinutes <= 0) {
      return {
        nightBase: { hours: 0, minutes: 0 },
        nightOvertime: { hours: 0, minutes: 0 },
      };
    }
    // Simplified proportional allocation: split night hours based on base/overtime ratio
    let nightBase = 0;
    let nightOt = 0;

    if (totalMinutes > 0) {
      // Calculate the proportion of base vs overtime hours
      const baseRatio = baseMinutes / totalMinutes;
      const overtimeRatio = otMinutes / totalMinutes;

      // Allocate night hours proportionally
      nightBase = Math.round(nightMinutes * baseRatio);
      nightOt = Math.max(0, nightMinutes - nightBase);
    }
    return {
      nightBase: { hours: Math.floor(nightBase / 60), minutes: nightBase % 60 },
      nightOvertime: { hours: Math.floor(nightOt / 60), minutes: nightOt % 60 },
    };
  }

  private overlapWithNight(
    start: string,
    end: string,
    nStart: number,
    nEnd: number
  ): number {
    const s = timeToMinutes(start);
    let e = timeToMinutes(end);
    if (e <= s) e += 1440; // overnight shift
    const intervals: Array<[number, number]> = [];
    if (nEnd > nStart) {
      intervals.push([nStart, nEnd], [nStart + 1440, nEnd + 1440]);
    } else {
      intervals.push([nStart, nEnd + 1440]);
    }
    let total = 0;
    for (const [a, b] of intervals) {
      const overlap = Math.max(0, Math.min(e, b) - Math.max(s, a));
      total += overlap;
    }
    return total;
  }

  private async getWeekRange(
    date: string,
    startDay: string
  ): Promise<{ start: string; end: string }> {
    const d = new Date(date + "T00:00:00");
    const dayIdx = d.getDay(); // 0 Sun .. 6 Sat
    const map: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const startIdx = map[startDay] ?? 1;
    const diff = (dayIdx - startIdx + 7) % 7;
    const startDate = new Date(d);
    startDate.setDate(d.getDate() - diff);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const fmt = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
        x.getDate()
      ).padStart(2, "0")}`;
    return { start: fmt(startDate), end: fmt(endDate) };
  }
}

export const settingsService = new SettingsService();
