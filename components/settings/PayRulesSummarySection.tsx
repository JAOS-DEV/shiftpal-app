import { useTheme } from "@/providers/ThemeProvider";
import { PayRules } from "@/types/settings";
import React from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

interface PayRulesSummarySectionProps {
  payRules: PayRules | undefined;
  currencySymbol: string;
  onEditOvertime: () => void;
  onEditNight: () => void;
  onEditWeekend: () => void;
}

export const PayRulesSummarySection: React.FC<PayRulesSummarySectionProps> = ({
  payRules,
  currencySymbol,
  onEditOvertime,
  onEditNight,
  onEditWeekend,
}) => {
  const { colors } = useTheme();

  const getOvertimeSummary = (): string => {
    const ot: any = payRules?.overtime || {};
    const basis = ot.active || "daily";
    const rule = basis === "weekly" ? ot.weekly : ot.daily;
    const threshold = rule?.threshold ?? (basis === "weekly" ? 40 : 8);
    const mode = rule?.mode || "fixed";
    const value =
      mode === "multiplier" ? rule?.multiplier ?? 1.5 : rule?.uplift ?? 2;
    return `${basis === "weekly" ? "Weekly" : "Daily"} threshold ${threshold}h • ${
      mode === "multiplier"
        ? `${value}×`
        : `+${currencySymbol}${Number(value).toFixed(2)}`
    }`;
  };

  const getNightSummary = (): string => {
    const n: any = payRules?.night || {};
    const enabled = n?.enabled !== false;
    const start = n?.start || "22:00";
    const end = n?.end || "06:00";
    const type = n?.type || "fixed";
    const value = Number(n?.value ?? 1);
    return enabled
      ? `${start}–${end} • ${
          type === "percentage"
            ? `+${value}%`
            : `+${currencySymbol}${value.toFixed(2)}`
        }`
      : "Disabled";
  };

  const getWeekendSummary = (): string => {
    const w: any = payRules?.weekend || {};
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
        Pay Rules (Simple)
      </ThemedText>

      {/* Overtime row */}
      <View style={styles.simpleRow}>
        <View style={styles.ruleContent}>
          <ThemedText style={styles.ruleTitle}>Overtime</ThemedText>
          <ThemedText style={{ color: colors.textSecondary }}>
            {getOvertimeSummary()}
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
          <ThemedText style={{ color: colors.textSecondary }}>
            {getNightSummary()}
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
          <ThemedText style={{ color: colors.textSecondary }}>
            {getWeekendSummary()}
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
    marginBottom: 16,
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
});

