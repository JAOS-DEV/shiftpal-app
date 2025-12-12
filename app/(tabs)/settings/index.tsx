import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface SettingsItem {
  key: string;
  label: string;
  icon: string;
  route: string;
}

const getSettingsItems = (currency: string): SettingsItem[] => [
  {
    key: "pay",
    label: "Pay & Rates",
    icon:
      currency === "USD"
        ? "dollarsign.circle.fill"
        : currency === "EUR"
        ? "eurosign.circle.fill"
        : "sterlingsign.circle.fill",
    route: "/settings/pay",
  },
  {
    key: "deductions",
    label: "Deductions",
    icon: "minus.circle.fill",
    route: "/settings/deductions",
  },
  {
    key: "appearance",
    label: "Appearance",
    icon: "paintbrush.fill",
    route: "/settings/appearance",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: "bell.fill",
    route: "/settings/notifications",
  },
  {
    key: "account",
    label: "Account & About",
    icon: "person.circle.fill",
    route: "/settings/account",
  },
];

export default function SettingsIndexScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const settingsItems = getSettingsItems(
    settings?.preferences?.currency || "GBP"
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60,
            ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.container,
              Platform.OS === "web" && {
                width: "100%",
                maxWidth: 1200,
                alignSelf: "center",
              },
            ]}
          >
            <ThemedText
              type="title"
              style={[styles.title, { color: colors.text }]}
            >
              Settings
            </ThemedText>

            {/* Settings Items */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              {settingsItems.map((item, index) => (
                <React.Fragment key={item.key}>
                  <TouchableOpacity
                    style={[
                      styles.settingsItem,
                      { borderBottomColor: colors.border },
                      index === settingsItems.length - 1 && styles.lastItem,
                    ]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      <IconSymbol
                        name={item.icon}
                        size={24}
                        color={colors.text}
                        style={styles.itemIcon}
                      />
                      <ThemedText
                        style={[styles.itemLabel, { color: colors.text }]}
                      >
                        {item.label}
                      </ThemedText>
                    </View>
                    <IconSymbol
                      name="chevron.right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 17,
    fontWeight: "400",
  },
});
