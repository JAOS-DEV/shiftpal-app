import { SettingsPage } from "@/components/SettingsPage";
import { ThemedView } from "@/components/ThemedView";
import { Platform, ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60, // Tab bar height + safe area
            ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={
              Platform.OS === "web"
                ? {
                    width: "100%",
                    maxWidth: 1200,
                    alignSelf: "center",
                    paddingHorizontal: 16,
                  }
                : undefined
            }
          >
            <SettingsPage />
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
