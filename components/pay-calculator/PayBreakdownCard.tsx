import { useTheme } from "@/providers/ThemeProvider";
import { PayBreakdown } from "@/types/settings";
import React from "react";
import {
    Platform, StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { ThemedText } from "../ThemedText";

interface PayBreakdownCardProps {
  breakdown: PayBreakdown | null;
  currencySymbol: string;
  isSaving: boolean;
  onSave: () => void;
}

export const PayBreakdownCard: React.FC<PayBreakdownCardProps> = ({
  breakdown,
  currencySymbol,
  isSaving,
  onSave,
}) => {
  const { colors } = useTheme();

  return (
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
        <ThemedText style={styles.negativeText}>
          -{currencySymbol}
          {(breakdown?.tax ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.breakdownRow}>
        <ThemedText>NI</ThemedText>
        <ThemedText style={styles.negativeText}>
          -{currencySymbol}
          {(breakdown?.ni ?? 0).toFixed(2)}
        </ThemedText>
      </View>
      <TouchableOpacity
        style={[
          styles.saveBtn,
          Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null,
        ]}
        onPress={onSave}
        disabled={isSaving}
      >
        <ThemedText style={styles.saveBtnText}>
          {isSaving ? "Saving..." : "Save Pay"}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
  negativeText: {
    color: "#FF3B30",
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
});

