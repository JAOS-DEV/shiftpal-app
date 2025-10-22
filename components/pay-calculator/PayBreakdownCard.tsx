import { useTheme } from "@/providers/ThemeProvider";
import { AllowanceItem, PayBreakdown } from "@/types/settings";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { PayBreakdownDisplay } from "./PayBreakdownDisplay";

interface PayBreakdownCardProps {
  breakdown: PayBreakdown | null;
  currencySymbol: string;
  isSaving: boolean;
  onSave: () => void;
  // New props for warnings and rate breakdown
  hasShifts?: boolean;
  hasPayRates?: boolean;
  hoursWorked?: { hours: number; minutes: number };
  overtimeWorked?: { hours: number; minutes: number };
  baseRate?: number;
  overtimeRate?: number;
  allowanceItems?: AllowanceItem[];
  totalHours?: number;
}

export const PayBreakdownCard: React.FC<PayBreakdownCardProps> = ({
  breakdown,
  currencySymbol,
  isSaving,
  onSave,
  hasShifts = false,
  hasPayRates = true,
  hoursWorked,
  overtimeWorked,
  baseRate,
  overtimeRate,
  allowanceItems = [],
  totalHours = 0,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Total Pay
      </ThemedText>

      {breakdown && (
        <PayBreakdownDisplay
          breakdown={breakdown}
          currencySymbol={currencySymbol}
          hoursWorked={hoursWorked}
          overtimeWorked={overtimeWorked}
          baseRate={baseRate}
          overtimeRate={overtimeRate}
          allowanceItems={allowanceItems}
          totalHours={totalHours}
          showTitle={false}
        />
      )}

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
