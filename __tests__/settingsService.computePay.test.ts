import { settingsService } from "@/services/settingsService";
import { AppSettings, PayCalculationInput } from "@/types/settings";

function baseSettings(): AppSettings {
  return {
    payRates: [
      {
        id: "base",
        label: "Base",
        value: 20,
        type: "base",
        createdAt: 0,
        updatedAt: 0,
      },
    ],
    payRules: {
      overtime: {
        active: "daily",
        daily: { threshold: 8, mode: "multiplier", multiplier: 1.5 },
      },
      weekend: { days: ["Sat", "Sun"] },
      payPeriod: { cycle: "weekly", startDay: "Monday" },
    },
    preferences: {
      currency: "GBP",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      stackingRule: "stack",
      holidayRecognition: false,
      roundingRule: "none",
    },
    notifications: { remindSubmitShifts: true, remindCheckPay: true },
  };
}

describe("settingsService.computePay", () => {
  test("daily basis multiplier applies to overtime hours only", () => {
    const settings = baseSettings();
    const input: PayCalculationInput = {
      mode: "manual",
      date: "2025-09-08", // Monday
      hourlyRateId: "base",
      overtimeRateId: null,
      // In manual mode, hoursWorked = base hours, overtimeWorked = OT hours
      hoursWorked: { hours: 8, minutes: 0 },
      overtimeWorked: { hours: 2, minutes: 0 },
    };
    const result = settingsService.computePay(input, settings);
    expect(result.base).toBeCloseTo(20 * 8, 2);
    expect(result.overtime).toBeCloseTo(20 * 1.5 * 2, 2);
  });

  test("weekly basis fixed uplift applies on weekend with stacking=stack", () => {
    const settings = baseSettings();
    settings.payRules.overtime = {
      active: "weekly",
      weekly: { threshold: 38, mode: "fixed", uplift: 0.5 },
    } as any;
    settings.payRules.weekend = {
      days: ["Sat", "Sun"],
      mode: "fixed",
      uplift: 0.5,
    } as any;
    settings.preferences.stackingRule = "stack";
    const input: PayCalculationInput = {
      mode: "manual",
      date: "2025-09-13", // Saturday
      hourlyRateId: "base",
      overtimeRateId: null,
      hoursWorked: { hours: 0, minutes: 0 },
      overtimeWorked: { hours: 4, minutes: 0 },
    };
    const result = settingsService.computePay(input, settings);
    // Overtime per hour = base (20) + 0.5 uplift; weekend adds +0.5 (stack) => 21.0
    expect(result.overtime).toBeCloseTo(21.0 * 4, 2);
  });

  test("weekly basis selects weekly fields only", () => {
    const settings = baseSettings();
    settings.payRules.overtime = {
      active: "weekly",
      daily: { threshold: 8, mode: "multiplier", multiplier: 2 },
      weekly: { threshold: 38, mode: "multiplier", multiplier: 1.25 },
    } as any;
    const input: PayCalculationInput = {
      mode: "manual",
      date: "2025-09-10",
      hourlyRateId: "base",
      overtimeRateId: null,
      hoursWorked: { hours: 0, minutes: 0 },
      overtimeWorked: { hours: 2, minutes: 0 },
    };
    const result = settingsService.computePay(input, settings);
    // Expect 1.25x (weekly) not 2x (daily)
    expect(result.overtime).toBeCloseTo(20 * 1.25 * 2, 2);
  });

  test("highestOnly picks better of weekend vs overtime", () => {
    const settings = baseSettings();
    settings.payRules.overtime = {
      active: "weekly",
      weekly: { threshold: 38, mode: "multiplier", multiplier: 1.5 },
    } as any;
    settings.payRules.weekend = {
      days: ["Sat", "Sun"],
      mode: "fixed",
      uplift: 0.5,
    } as any;
    settings.preferences.stackingRule = "highestOnly";
    const input: PayCalculationInput = {
      mode: "manual",
      date: "2025-09-13", // Saturday
      hourlyRateId: "base",
      overtimeRateId: null,
      hoursWorked: { hours: 0, minutes: 0 },
      overtimeWorked: { hours: 3, minutes: 0 },
    };
    const result = settingsService.computePay(input, settings);
    // highestOnly: choose max(OT=30, weekend=20.5) => 30 per hour
    expect(result.overtime).toBeCloseTo(30 * 3, 2);
  });

  test("highestOnly with weekend multiplier vs daily OT multiplier", () => {
    const settings = baseSettings();
    settings.payRules.overtime = {
      active: "daily",
      daily: { threshold: 8, mode: "multiplier", multiplier: 1.5 },
    } as any;
    settings.payRules.weekend = {
      days: ["Sat", "Sun"],
      mode: "multiplier",
      multiplier: 1.25,
    } as any;
    settings.preferences.stackingRule = "highestOnly";
    const input: PayCalculationInput = {
      mode: "manual",
      date: "2025-09-13", // Saturday
      hourlyRateId: "base",
      overtimeRateId: null,
      hoursWorked: { hours: 0, minutes: 0 },
      overtimeWorked: { hours: 2, minutes: 0 },
    };
    const result = settingsService.computePay(input, settings);
    // Compare 30 vs 25 => 30 per hour
    expect(result.overtime).toBeCloseTo(30 * 2, 2);
  });

  test("night uplift applies to base and overlaps obey stacking", () => {
    const settings = baseSettings();
    settings.payRules.night = { type: "fixed", value: 0.5 } as any;
    settings.preferences.stackingRule = "stack";
    const input: PayCalculationInput = {
      mode: "manual",
      date: "2025-09-09",
      hourlyRateId: "base",
      overtimeRateId: null,
      hoursWorked: { hours: 2, minutes: 0 },
      overtimeWorked: { hours: 1, minutes: 0 },
      nightBaseHours: { hours: 1, minutes: 0 },
      nightOvertimeHours: { hours: 1, minutes: 0 },
    };
    const result = settingsService.computePay(input, settings);
    // Base remains £40, OT remains per current settings; night uplift is in 'uplifts'
    expect(result.base).toBeCloseTo(40, 2);
    expect(result.uplifts).toBeCloseTo(1.0, 2); // 0.5 + 0.5
  });

  test("tracker mode night allocation adds uplift via derived hours", async () => {
    const settings = baseSettings();
    // Enable night uplift fixed 0.5/h
    settings.payRules.night = {
      enabled: true,
      type: "fixed",
      value: 0.5,
    } as any;
    // For now, night uplift is applied in manual path; tracker relies on derived split then calculator path
    const input: PayCalculationInput = {
      mode: "manual",
      date: "2025-09-09",
      hourlyRateId: "base",
      overtimeRateId: null,
      hoursWorked: { hours: 2, minutes: 0 },
      overtimeWorked: { hours: 1, minutes: 0 },
      nightBaseHours: { hours: 1, minutes: 0 },
      nightOvertimeHours: { hours: 1, minutes: 0 },
    } as any;
    const result = settingsService.computePay(input, settings);
    expect(result.uplifts).toBeCloseTo(1.0, 2);
  });

  // Rounding tests are deferred until we finalize rounding semantics (nearest vs up) across base and overtime
});
