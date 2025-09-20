export type PayRateType = "base" | "overtime" | "premium";

export interface PayRate {
  id: string;
  label: string;
  value: number; // hourly value in currency units
  type: PayRateType;
  createdAt: number;
  updatedAt: number;
}

// New tier-based overtime model (backward-compatible with legacy flat fields below)
export interface OvertimeTierRule {
  threshold?: number; // hours
  mode?: "multiplier" | "fixed"; // how to apply overtime pay
  multiplier?: number; // e.g., 1.5 (Base × 1.5)
  uplift?: number; // e.g., 0.5 (Base + £0.50/h)
}

export interface OvertimeRules {
  enabled?: boolean;
  // Only one basis applies at a time
  active?: "daily" | "weekly";
  // New nested structure (preferred)
  daily?: OvertimeTierRule;
  weekly?: OvertimeTierRule;
  // Legacy flat fields (still read for compatibility and migrated at load time)
  dailyThreshold?: number; // hours
  dailyMultiplier?: number; // e.g., 1.5
  weeklyThreshold?: number; // hours
  weeklyMultiplier?: number; // e.g., 2.0
}

export interface NightRules {
  enabled?: boolean;
  start?: string; // "HH:MM"
  end?: string; // "HH:MM"
  // Legacy shape retained; future: align to mode/multiplier/uplift if needed
  type?: "percentage" | "fixed";
  value?: number; // percentage or fixed uplift per hour
}

export interface WeekendRules {
  enabled?: boolean;
  days?: Array<"Sat" | "Sun">;
  // New unified shape
  mode?: "multiplier" | "fixed";
  multiplier?: number; // e.g., 1.5 for +50%
  uplift?: number; // e.g., 0.5 for +£0.50/h
  // Legacy shape (percentage or fixed value)
  type?: "percentage" | "fixed";
  value?: number;
}

export interface TaxRules {
  type?: "flat"; // future: "banded"
  percentage?: number; // 0-100
  personalAllowance?: number; // currency units deducted from gross before tax
}

export interface NiRules {
  type?: "flat"; // future: "banded"
  percentage?: number; // 0-100
  threshold?: number; // gross above this is NI-chargeable
}

export interface AllowanceItem {
  id: string;
  type: string; // e.g., "Meal", "Mileage"
  value: number; // currency amount or per-unit amount
  unit: "perShift" | "perHour" | "perKm";
}

export interface PayPeriodConfig {
  cycle: "weekly" | "fortnightly" | "monthly";
  startDay?: string; // Monday, etc.
  startDate?: number; // 1-31 when monthly
}

export interface PayRules {
  overtime?: OvertimeRules;
  night?: NightRules;
  weekend?: WeekendRules;
  allowances?: AllowanceItem[];
  payPeriod?: PayPeriodConfig;
  tax?: TaxRules;
  ni?: NiRules;
}

export interface Preferences {
  currency: "GBP" | "USD" | "EUR" | string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | string;
  timeFormat: "24h" | "12h";
  stackingRule: "stack" | "highestOnly";
  holidayRecognition: boolean;
  roundingRule: "5min" | "15min" | "none" | string;
  weeklyGoal?: number; // target gross or net per week (we'll use net total)
  monthlyGoal?: number; // target per month (net)
}

export interface NotificationsPrefs {
  remindSubmitShifts: boolean;
  remindCheckPay: boolean;
}

export interface AppSettings {
  payRates: PayRate[];
  payRules: PayRules;
  preferences: Preferences;
  notifications: NotificationsPrefs;
}

export interface HoursAndMinutes {
  hours: number;
  minutes: number;
}

export interface PayBreakdown {
  base: number;
  overtime: number;
  uplifts: number;
  allowances: number;
  gross: number; // base + overtime + uplifts + allowances
  tax: number; // deductions
  ni: number; // deductions
  total: number; // final total after deductions (kept as 'total' for compatibility)
}

export interface PayCalculationInput {
  mode: "tracker" | "manual";
  date: string; // YYYY-MM-DD
  hourlyRateId: string | null;
  overtimeRateId: string | null;
  hoursWorked: HoursAndMinutes; // base hours
  overtimeWorked: HoursAndMinutes; // overtime hours (manual) or derived
  // Calculator mode: optional explicit night allocation
  nightBaseHours?: HoursAndMinutes;
  nightOvertimeHours?: HoursAndMinutes;
}

export interface PayCalculationEntry {
  id: string;
  input: PayCalculationInput;
  calculatedPay: PayBreakdown;
  // Snapshot of deduction-related settings when this entry was saved
  settingsVersion?: string;
  // When user used manual rates (no saved pay rates), store the numeric rates
  rateSnapshot?: {
    base?: number;
    overtime?: number;
  };
  // Optional calculation snapshots for richer History rendering
  calcSnapshot?: {
    // Hours actually used for calculation after auto-splits
    usedBase?: HoursAndMinutes;
    usedOvertime?: HoursAndMinutes;
    // Night split used at calculation time
    night?: {
      base?: HoursAndMinutes;
      overtime?: HoursAndMinutes;
      type?: "fixed" | "percentage";
      value?: number; // fixed amount or percentage
    };
    // Weekend rules active that day
    weekend?: {
      mode?: "fixed" | "multiplier";
      value?: number; // uplift amount or multiplier
    };
  };
  createdAt: number;
}
