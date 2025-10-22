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
  private versionListeners = new Set<(v: string) => void>();
  // In-memory cache to avoid async races across rapid updates (especially on iOS)
  private cachedSettings: AppSettings | null = null;
  // Track current user to detect user changes
  private currentUserId: string | null = null;

  subscribe(listener: (s: AppSettings) => void): () => void {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }

  subscribeVersion(listener: (v: string) => void): () => void {
    this.versionListeners.add(listener);
    return () => this.versionListeners.delete(listener);
  }

  private notifySettingsChanged(next: AppSettings) {
    for (const cb of this.settingsListeners) {
      try {
        cb(next);
      } catch {}
    }
    // Also notify version listeners
    const v = this.computeSettingsVersion(next);
    for (const cb of this.versionListeners) {
      try {
        cb(v);
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

  // Versioning: capture only deduction-related and rounding fields that affect totals
  computeSettingsVersion(s: AppSettings): string {
    const payload = {
      tax: s?.payRules?.tax || {},
      ni: s?.payRules?.ni || {},
    };
    try {
      return this.simpleHash(JSON.stringify(payload));
    } catch {
      return "v0";
    }
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
    const nightBaseRaw = this.toHours(
      input.nightBaseHours || { hours: 0, minutes: 0 }
    );
    const nightOtRaw = this.toHours(
      input.nightOvertimeHours || { hours: 0, minutes: 0 }
    );

    // Prepare base and overtime hours; allow tracker auto-split to override later
    let baseHours = baseHoursRaw;
    let overtimeHours = overtimeHoursRaw;

    // Use minute precision: do not round hours
    const nightBaseHours = nightBaseRaw;
    const nightOvertimeHours = nightOtRaw;

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

    // Night uplift: allocate night hours (applies in both manual and tracker modes)
    const nightRules = settings.payRules?.night;
    let nightUplift = 0;
    if (
      nightRules &&
      (nightRules as any)?.enabled !== false &&
      (nightBaseHours > 0 || nightOvertimeHours > 0)
    ) {
      // Compute night uplift per-hour relative to base rate
      const nightUpliftPerHour = (() => {
        if (
          nightRules.type === "percentage" &&
          typeof nightRules.value === "number"
        ) {
          return (baseRate?.value ?? 0) * (nightRules.value / 100);
        }
        if (
          nightRules.type === "fixed" &&
          typeof nightRules.value === "number"
        ) {
          return nightRules.value;
        }
        return 0;
      })();
      if (nightUpliftPerHour > 0) {
        const stacking = prefs.stackingRule || "stack";
        // For base night hours, add as uplift component
        nightUplift += nightUpliftPerHour * nightBaseHours;
        // For overtime night hours, obey stackingRule vs weekend already processed into overtimePerHour
        if (stacking === "stack") {
          nightUplift += nightUpliftPerHour * nightOvertimeHours;
        } else {
          // highestOnly: compare (OT with weekend) vs (base+night). Since OT already chosen, compare per-hour
          const basePlusNight = (baseRate?.value ?? 0) + nightUpliftPerHour;
          const betterPerHour = Math.max(overtimePerHour, basePlusNight);
          const delta = (betterPerHour - overtimePerHour) * nightOvertimeHours;
          if (delta > 0) nightUplift += delta;
        }
      }
    }

    // Uplifts (night/weekend) and allowances — placeholder totals (0) for now
    const uplifts = nightUplift;
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
    // Collect all shifts for the date: unsubmitted + submitted
    const unsubmitted = await shiftService.getShiftsForDate(date);
    let submittedShifts: Array<{
      start: string;
      end: string;
      durationMinutes?: number;
    }> = [];
    try {
      const days = await shiftService.getSubmittedDays({ type: "all" });
      const day = days.find((d) => d.date === date);
      if (day?.submissions?.length) {
        for (const s of day.submissions) {
          submittedShifts.push(...((s.shifts || []) as any));
        }
      }
    } catch {}
    const allShifts: Array<{
      start: string;
      end: string;
      durationMinutes?: number;
    }> = [...unsubmitted, ...submittedShifts] as any;

    const totalMinutes = allShifts.reduce(
      (sum, sh) => sum + (sh.durationMinutes ?? 0),
      0
    );
    if (totalMinutes <= 0) {
      return {
        base: { hours: 0, minutes: 0 },
        overtime: { hours: 0, minutes: 0 },
      };
    }

    // Determine base vs overtime minutes for the date according to active basis
    const ot = (settings?.payRules?.overtime || {}) as any;
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

    return {
      base: { hours: Math.floor(baseMinutes / 60), minutes: baseMinutes % 60 },
      overtime: { hours: Math.floor(otMinutes / 60), minutes: otMinutes % 60 },
    };
  }

  private isWeekendDate(date: string, weekendRules: any): boolean {
    try {
      const d = new Date(date + "T00:00:00");
      const day = d.getDay(); // 0=Sun,6=Sat
      const days: string[] = Array.isArray(weekendRules?.days)
        ? weekendRules.days
        : ["Sat", "Sun"];
      const map: Record<number, string> = { 0: "Sun", 6: "Sat" };
      return days.includes(map[day]);
    } catch {
      return false;
    }
  }

  private applyWeekendToRate(
    rate: number,
    date: string,
    weekendRules: any,
    stackingWithOther: boolean
  ): number {
    if (!rate) return 0;
    if (!this.isWeekendDate(date, weekendRules)) return rate;
    if (!weekendRules) return rate;
    const mode = weekendRules?.mode as "multiplier" | "fixed" | undefined;
    const multiplier = weekendRules?.multiplier;
    const uplift = weekendRules?.uplift;
    if (mode === "multiplier" && typeof multiplier === "number") {
      return rate * multiplier;
    }
    if (mode === "fixed" && typeof uplift === "number") {
      return rate + uplift;
    }
    // Legacy support: type/value
    if (
      weekendRules?.type === "percentage" &&
      typeof weekendRules?.value === "number"
    ) {
      return rate * (1 + weekendRules.value / 100);
    }
    if (
      weekendRules?.type === "fixed" &&
      typeof weekendRules?.value === "number"
    ) {
      return rate + weekendRules.value;
    }
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

  // Recompute a single entry with current settings
  async recomputeEntry(
    entry: PayCalculationEntry
  ): Promise<PayCalculationEntry> {
    const settings = await this.getSettings();
    const recalculated = this.computePay(entry.input, settings);
    return {
      ...entry,
      calculatedPay: recalculated,
      settingsVersion: this.computeSettingsVersion(settings),
    };
  }

  async updateHistoryEntry(updated: PayCalculationEntry): Promise<void> {
    const userId = getUserId();
    const userPayHistoryKey = getUserPayHistoryKey(userId);
    const data = (await AsyncStorage.getItem(userPayHistoryKey)) || "[]";
    const list: PayCalculationEntry[] = JSON.parse(data);
    const idx = list.findIndex((e) => e.id === updated.id);
    if (idx !== -1) {
      list[idx] = updated;
      await AsyncStorage.setItem(userPayHistoryKey, JSON.stringify(list));
    }
  }

  async recomputeMany(entryIds: string[]): Promise<PayCalculationEntry[]> {
    const userId = getUserId();
    const userPayHistoryKey = getUserPayHistoryKey(userId);
    const data = (await AsyncStorage.getItem(userPayHistoryKey)) || "[]";
    const list: PayCalculationEntry[] = JSON.parse(data);
    const settings = await this.getSettings();
    const version = this.computeSettingsVersion(settings);
    const map = new Map(list.map((e) => [e.id, e] as const));
    const updated: PayCalculationEntry[] = [];
    for (const id of entryIds) {
      const original = map.get(id);
      if (!original) continue;
      const next = {
        ...original,
        calculatedPay: this.computePay(original.input, settings),
        settingsVersion: version,
      };
      map.set(id, next);
      updated.push(next);
    }
    const nextList = Array.from(map.values());
    await AsyncStorage.setItem(userPayHistoryKey, JSON.stringify(nextList));
    // Best effort: sync updated entries to Firebase as well
    try {
      if (userId) {
        const { firestore } = getFirebase();
        const { doc, setDoc } = await import("firebase/firestore");
        for (const entry of updated) {
          const ref = doc(firestore, "users", userId, "payHistory", entry.id);
          await setDoc(ref, { ...entry, userId }, { merge: true });
        }
      }
    } catch {}
    return updated;
  }

  async getHistorySettingsVersion(): Promise<string> {
    const settings = await this.getSettings();
    return this.computeSettingsVersion(settings);
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
    } catch {}
  }

  async deriveTrackerHoursForDate(date: string): Promise<HoursAndMinutes> {
    // Sum unsubmitted + submitted totals for the same date (no double-counting between stores)
    const shifts = await shiftService.getShiftsForDate(date);
    const unsubmitted = shiftService.calculateDayTotal(shifts).totalMinutes;
    let submitted = 0;
    try {
      const days = await shiftService.getSubmittedDays({ type: "all" });
      const day = days.find((d) => d.date === date);
      submitted = Math.max(0, day?.totalMinutes || 0);
    } catch {}
    const totalMinutes = Math.max(0, (unsubmitted || 0) + (submitted || 0));
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
    if (!night || (!night.start && !night.end)) {
      return {
        nightBase: { hours: 0, minutes: 0 },
        nightOvertime: { hours: 0, minutes: 0 },
      };
    }

    // Collect all shifts for the date: unsubmitted + submitted
    const unsubmitted = await shiftService.getShiftsForDate(date);
    let submittedShifts: any[] = [];
    try {
      const days = await shiftService.getSubmittedDays({ type: "all" });
      const day = days.find((d) => d.date === date);
      if (day?.submissions?.length) {
        for (const s of day.submissions) {
          submittedShifts.push(...(s.shifts || []));
        }
      }
    } catch {}
    const allShifts: Array<{
      start: string;
      end: string;
      durationMinutes?: number;
    }> = [...unsubmitted, ...submittedShifts] as any;

    const totalMinutes = allShifts.reduce(
      (sum, sh) => sum + (sh.durationMinutes ?? 0),
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
    const nightMinutes = allShifts.reduce(
      (sum, sh) => sum + this.overlapWithNight(sh.start, sh.end, ns, ne),
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
    // Chronological allocation for daily basis: count night minutes falling after threshold as OT night
    let nightBase = nightMinutes;
    let nightOt = 0;
    if (active === "daily" && typeof ot?.daily?.threshold === "number") {
      // Build per-minute mask across the day for shifts and night window, then walk from 0..1440
      // This avoids proportional splitting and matches real-time accumulation.
      const thresholdMin = Math.max(0, ot.daily.threshold * 60);
      // Create timeline occupancy for the day from recorded shifts
      const occ: boolean[] = new Array(1440).fill(false);
      for (const sh of allShifts) {
        const s = timeToMinutes(sh.start);
        let e = timeToMinutes(sh.end);
        if (e <= s) e += 1440; // overnight
        for (let m = s; m < e; m++) occ[m % 1440] = true;
      }
      // Night window minutes
      const nightMask: boolean[] = new Array(1440).fill(false);
      const intervals: Array<[number, number]> = [];
      if (ne > ns) intervals.push([ns, ne]);
      else intervals.push([ns, ne + 1440]);
      for (const [a, b] of intervals) {
        for (let m = a; m < b; m++) nightMask[m % 1440] = true;
      }
      // Walk day timeline to accumulate base vs OT minutes chronologically
      let workedSoFar = 0;
      let baseNight = 0;
      let otNight = 0;
      for (let minute = 0; minute < 1440; minute++) {
        if (!occ[minute]) continue;
        const isNight = nightMask[minute];
        const isBase = workedSoFar < thresholdMin;
        if (isNight) {
          if (isBase) baseNight++;
          else otNight++;
        }
        workedSoFar++;
      }
      nightBase = baseNight;
      nightOt = otNight;
    } else {
      // Weekly or unspecified basis: fall back to proportional split to keep behavior reasonable across days
      nightBase = Math.round((nightMinutes * baseMinutes) / totalMinutes);
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
