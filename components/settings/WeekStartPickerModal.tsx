import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings, PayRules } from "@/types/settings";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../ThemedText";

interface WeekStartPickerModalProps {
  visible: boolean;
  settings: AppSettings | null;
  onClose: () => void;
  onSettingsChange: () => void;
}

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const WeekStartPickerModal: React.FC<WeekStartPickerModalProps> = ({
  visible,
  settings,
  onClose,
  onSettingsChange,
}) => {
  const { colors } = useTheme();

  const updatePayRules = async (updates: Partial<PayRules>): Promise<void> => {
    await settingsService.setPayRules(updates);
    onSettingsChange();
  };

  const handleDaySelect = async (day: string): Promise<void> => {
    await updatePayRules({
      payPeriod: {
        ...(settings?.payRules?.payPeriod || {}),
        startDay: day,
        cycle: settings?.payRules?.payPeriod?.cycle || "weekly",
      },
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.weekStartModal,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ThemedText
            type="subtitle"
            style={[
              styles.modalTitle,
              { color: colors.text, textAlign: "center" },
            ]}
          >
            Start Week On
          </ThemedText>

          <View style={styles.pickerContainer}>
            {/* Top gradient overlay */}
            <LinearGradient
              colors={[
                colors.surface,
                colors.surface + "CC",
                colors.surface + "00",
              ]}
              style={[
                styles.gradientOverlay,
                styles.topGradient,
                { pointerEvents: "none" },
              ]}
            />

            <ScrollView
              style={styles.wheelPicker}
              showsVerticalScrollIndicator={false}
              snapToInterval={44}
              decelerationRate="fast"
              contentContainerStyle={styles.wheelContent}
              bounces={false}
            >
              {/* Add padding items at start */}
              <View style={styles.wheelItem} />
              <View style={styles.wheelItem} />

              {WEEK_DAYS.map((day) => {
                const isSelected =
                  (settings?.payRules?.payPeriod?.startDay || "Monday") === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.wheelItem,
                      isSelected && {
                        backgroundColor: colors.primary + "20",
                        borderRadius: 8,
                        marginHorizontal: 8,
                      }
                    ]}
                    onPress={() => handleDaySelect(day)}
                  >
                    <ThemedText
                      style={[
                        styles.wheelItemText,
                        {
                          color: isSelected ? colors.primary : colors.textSecondary,
                          fontSize: isSelected ? 20 : 17,
                          fontWeight: isSelected ? "600" : "400",
                          opacity: isSelected ? 1 : 0.6,
                        },
                      ]}
                    >
                      {day}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}

              {/* Add padding items at end */}
              <View style={styles.wheelItem} />
              <View style={styles.wheelItem} />
            </ScrollView>


            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={[
                colors.surface + "00",
                colors.surface + "CC",
                colors.surface,
              ]}
              style={[
                styles.gradientOverlay,
                styles.bottomGradient,
                { pointerEvents: "none" },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.modalButton,
              { borderColor: colors.primary, alignSelf: "center", width: "80%" },
            ]}
            onPress={onClose}
          >
            <ThemedText
              style={{
                color: colors.primary,
                fontWeight: "600",
                alignSelf: "center",
              }}
            >
              OK
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  weekStartModal: {
    width: "85%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    marginBottom: 4,
  },
  pickerContainer: {
    height: 220,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  wheelPicker: {
    height: 220,
    width: "100%",
  },
  wheelContent: {
    paddingVertical: 0,
  },
  wheelItem: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  wheelItemText: {
    textAlign: "center",
    letterSpacing: 0.5,
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 88,
    zIndex: 1,
  },
  topGradient: {
    top: 0,
  },
  bottomGradient: {
    bottom: 0,
  },
  modalButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});

