import { useTheme } from "@/providers/ThemeProvider";
import {
  NightRules,
  OvertimeRules,
  PayRules,
  WeekendRules,
} from "@/types/settings";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface PayRulesSummarySectionProps {
  payRules: PayRules | undefined;
  currencySymbol: string;
  onEditOvertime: () => void;
  onEditNight: () => void;
  onEditWeekend: () => void;
  onEditWeekStart: () => void;
  onHelp: (title: string, body: string) => void;
}

export const PayRulesSummarySection: React.FC<PayRulesSummarySectionProps> = ({
  payRules,
  currencySymbol,
  onEditOvertime,
  onEditNight,
  onEditWeekend,
  onEditWeekStart,
  onHelp,
}) => {
  const { colors } = useTheme();

  const getOvertimeSummary = (): string => {
    const ot: OvertimeRules = payRules?.overtime || {};
    const enabled = ot?.enabled !== false;

    if (!enabled) {
      return "Disabled";
    }

    const basis = ot.active || "daily";
    const rule = basis === "weekly" ? ot.weekly : ot.daily;
    const threshold = rule?.threshold ?? (basis === "weekly" ? 40 : 8);
    return `${basis === "weekly" ? "Weekly" : "Daily"} threshold ${threshold}h`;
  };

  const getNightSummary = (): string => {
    const n: NightRules = payRules?.night || {};
    const enabled = n?.enabled === true;
    const start = n?.start || "22:00";
    const end = n?.end || "06:00";
    const mode = n?.mode || "fixed";
    const value =
      mode === "multiplier"
        ? Number(n?.multiplier ?? 1.25)
        : Number(n?.uplift ?? 1);
    return enabled
      ? `${start}–${end} • ${
          mode === "multiplier"
            ? `+${Math.round((value - 1) * 100)}%`
            : `+${currencySymbol}${value.toFixed(2)}/h`
        }`
      : "Disabled";
  };

  const getWeekendSummary = (): string => {
    const w: WeekendRules = payRules?.weekend || {};
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
    return enabled
      ? `${days} • ${
          mode === "multiplier"
            ? `+${Math.round((value - 1) * 100)}%`
            : `+${currencySymbol}${value.toFixed(2)}/h`
        }`
      : "Disabled";
  };

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <ThemedText
        type="subtitle"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        Pay Rules (Tracker Mode)
      </ThemedText>

      <ThemedText
        style={[styles.sectionDescription, { color: colors.textSecondary }]}
      >
        These rules automatically apply when calculating pay in tracker mode.
        Manual mode gives you full control.
      </ThemedText>

      {/* Overtime row */}
      <View style={styles.simpleRow}>
        <View style={styles.ruleContent}>
          <ThemedText style={styles.ruleTitle}>Overtime</ThemedText>
          <ThemedText
            style={[styles.ruleDescription, { color: colors.textSecondary }]}
          >
            {getOvertimeSummary()}
          </ThemedText>
          <ThemedText
            style={[styles.ruleModeNote, { color: colors.textSecondary }]}
          >
            Auto-applies in tracker mode
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={onEditOvertime}
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
        <View style={styles.ruleContent}>
          <ThemedText style={styles.ruleTitle}>Night</ThemedText>
          <ThemedText
            style={[styles.ruleDescription, { color: colors.textSecondary }]}
          >
            {getNightSummary()}
          </ThemedText>
          <ThemedText
            style={[styles.ruleModeNote, { color: colors.textSecondary }]}
          >
            Auto-applies in tracker mode
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={onEditNight}
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
        <View style={styles.ruleContent}>
          <ThemedText style={styles.ruleTitle}>Weekend</ThemedText>
          <ThemedText
            style={[styles.ruleDescription, { color: colors.textSecondary }]}
          >
            {getWeekendSummary()}
          </ThemedText>
          <ThemedText
            style={[styles.ruleModeNote, { color: colors.textSecondary }]}
          >
            Auto-applies in tracker mode
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={onEditWeekend}
        >
          <ThemedText
            style={[styles.actionButtonText, { color: colors.primary }]}
          >
            Edit
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 18,
  },
  simpleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontWeight: "600",
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
  ruleDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  ruleModeNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
});
