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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { shiftService } from "./shiftService";

const SETTINGS_KEY = "shiftpal.settings";
const PAY_HISTORY_KEY = "shiftpal.pay_history";

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
      overtime: { dailyThreshold: 8, dailyMultiplier: 1.5 },
      weekend: { days: ["Sat", "Sun"], type: "fixed", value: 0 },
      allowances: [],
      payPeriod: { cycle: "weekly", startDay: "Monday" },
    },
    preferences: {
      currency: "GBP",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      stackingRule: "stack",
      holidayRecognition: false,
      roundingRule: "15min",
      weeklyGoal: 1000,
      monthlyGoal: 4000,
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
    // Try Firebase first
    try {
      const userId = getUserId();
      if (userId) {
        const { firestore } = getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");
        const ref = doc(firestore, "users", userId, "config", "settings");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as AppSettings;
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
          return this.normalizeSettings(data);
        }
      }
    } catch {}

    // Fallback to local
    const local = await AsyncStorage.getItem(SETTINGS_KEY);
    if (local) {
      return this.normalizeSettings(JSON.parse(local));
    }
    const defaults = defaultSettings();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
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
    return merged;
  }

  async saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const next: AppSettings = this.normalizeSettings({
      ...current,
      ...partial,
    });
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    // Best-effort sync
    try {
      const userId = getUserId();
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

  private roundHours(
    hours: number,
    roundingRule: Preferences["roundingRule"]
  ): number {
    if (!roundingRule || roundingRule === "none") return hours;
    const minutes = hours * 60;
    const step =
      roundingRule === "5min"
        ? 5
        : roundingRule === "15min"
        ? 15
        : parseInt(String(roundingRule).replace(/\D/g, "")) || 1;
    const rounded = Math.round(minutes / step) * step;
    return rounded / 60;
  }

  computePay(input: PayCalculationInput, settings: AppSettings): PayBreakdown {
    const prefs = settings.preferences;
    const overtimeRules = settings.payRules?.overtime;

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

    // Derive overtime for tracker mode using daily threshold, if provided and overtime input looks zero
    let baseHours = baseHoursRaw;
    let overtimeHours = overtimeHoursRaw;
    if (input.mode === "tracker" && overtimeRules?.dailyThreshold) {
      const threshold = overtimeRules.dailyThreshold;
      if (baseHoursRaw > threshold && overtimeHoursRaw === 0) {
        overtimeHours = baseHoursRaw - threshold;
        baseHours = threshold;
      }
    }

    baseHours = this.roundHours(baseHours, prefs.roundingRule);
    overtimeHours = this.roundHours(overtimeHours, prefs.roundingRule);

    const basePay = (baseRate?.value ?? 0) * baseHours;
    const overtimePay = (overtimeRate?.value ?? 0) * overtimeHours;

    // Uplifts (night/weekend) and allowances — placeholder totals (0) for now
    const uplifts = 0;
    const allowances = this.computeAllowances(
      settings.payRules?.allowances || [],
      baseHours + overtimeHours
    );

    const gross = basePay + overtimePay + uplifts + allowances;

    // Simple Tax/NI implementation (flat percentage with optional thresholds/allowances)
    const taxRules = settings.payRules?.tax;
    const niRules = settings.payRules?.ni;

    let taxableBase = gross;
    if (typeof taxRules?.personalAllowance === "number") {
      taxableBase = Math.max(0, taxableBase - taxRules.personalAllowance);
    }
    const taxPct =
      typeof taxRules?.percentage === "number" ? taxRules.percentage : 0;
    const tax = (taxPct / 100) * taxableBase;

    let niBase = gross;
    if (typeof niRules?.threshold === "number") {
      niBase = Math.max(0, niBase - niRules.threshold);
    }
    const niPct =
      typeof niRules?.percentage === "number" ? niRules.percentage : 0;
    const ni = (niPct / 100) * niBase;

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

  private computeAllowances(
    allowances: AllowanceItem[],
    hours: number
  ): number {
    return allowances.reduce((sum, a) => {
      if (a.unit === "perShift") return sum + a.value;
      if (a.unit === "perHour") return sum + a.value * hours;
      return sum; // perKm unsupported in calculator context
    }, 0);
  }

  private toMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async savePayCalculation(entry: PayCalculationEntry): Promise<void> {
    const data = (await AsyncStorage.getItem(PAY_HISTORY_KEY)) || "[]";
    const list: PayCalculationEntry[] = JSON.parse(data);
    list.unshift(entry);
    await AsyncStorage.setItem(PAY_HISTORY_KEY, JSON.stringify(list));
    // Best-effort sync to Firebase
    try {
      const userId = getUserId();
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
      const local = await AsyncStorage.getItem(PAY_HISTORY_KEY);
      const list: PayCalculationEntry[] = local ? JSON.parse(local) : [];
      return list;
    } catch {
      return [];
    }
  }

  async deriveTrackerHoursForDate(date: string): Promise<HoursAndMinutes> {
    const shifts = await shiftService.getShiftsForDate(date);
    const { totalMinutes } = shiftService.calculateDayTotal(shifts);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  }
}

export const settingsService = new SettingsService();
