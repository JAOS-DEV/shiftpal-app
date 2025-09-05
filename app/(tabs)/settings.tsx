import { SettingsPage } from "@/components/SettingsPage";
import { ScrollView } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }} // Tab bar height + safe area
      >
        <SettingsPage />
      </ScrollView>
    </SafeAreaView>
  );
}
