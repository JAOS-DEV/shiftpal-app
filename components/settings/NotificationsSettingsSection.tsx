import { useTheme } from "@/providers/ThemeProvider";
import { settingsService } from "@/services/settingsService";
import { NotificationsPrefs } from "@/types/settings";
import React from "react";
import {
    StyleSheet,
    Switch,
    View,
} from "react-native";
import { ThemedText } from "../ui/ThemedText";

interface NotificationsSettingsSectionProps {
  notifications: NotificationsPrefs | undefined;
  onSettingsChange: () => void;
}

export const NotificationsSettingsSection: React.FC<NotificationsSettingsSectionProps> = ({
  notifications,
  onSettingsChange,
}) => {
  const { colors } = useTheme();

  const updateNotifications = async (updates: Partial<NotificationsPrefs>): Promise<void> => {
    await settingsService.setNotificationsPrefs({ ...notifications, ...updates });
    onSettingsChange();
  };

  const handleRemindSubmitShiftsChange = async (value: boolean): Promise<void> => {
    await updateNotifications({ remindSubmitShifts: value });
  };

  const handleRemindCheckPayChange = async (value: boolean): Promise<void> => {
    await updateNotifications({ remindCheckPay: value });
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
        Notifications
      </ThemedText>

      <View style={styles.content}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <ThemedText style={[styles.toggleLabel, { color: colors.text }]}>
              Remind to submit shifts
            </ThemedText>
            <ThemedText style={[styles.toggleDescription, { color: colors.textSecondary }]}>
              Get reminders to submit your shifts at the end of the day
            </ThemedText>
          </View>
          <Switch
            value={notifications?.remindSubmitShifts ?? true}
            onValueChange={handleRemindSubmitShiftsChange}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <ThemedText style={[styles.toggleLabel, { color: colors.text }]}>
              Remind to check pay
            </ThemedText>
            <ThemedText style={[styles.toggleDescription, { color: colors.textSecondary }]}>
              Get reminders to check your calculated pay
            </ThemedText>
          </View>
          <Switch
            value={notifications?.remindCheckPay ?? true}
            onValueChange={handleRemindCheckPayChange}
          />
        </View>
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
  content: {
    gap: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
