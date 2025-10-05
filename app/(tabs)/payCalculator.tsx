import { SegmentedSwitcher } from "@/components/SegmentedSwitcher";
import { ThemedView } from "@/components/ThemedView";
import { PayCalculatorTab } from "@/components/pay-calculator/PayCalculatorTab";
import { PayHistoryTab } from "@/components/pay-calculator/PayHistoryTab";
import { settingsService } from "@/services/settingsService";
import { AppSettings, PayCalculationEntry } from "@/types/settings";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

type TopTab = "calculator" | "history";

export default function PayCalculatorScreen(): JSX.Element {
  const [topTab, setTopTab] = useState<TopTab>("calculator");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [payHistory, setPayHistory] = useState<PayCalculationEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Load settings when focused
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!isFocused) return;
      setLoadingSettings(true);
      const s = await settingsService.getSettings();
      setSettings(s);
      setLoadingSettings(false);
    };
    void load();

    // Subscribe to live settings changes
    const unsub = settingsService.subscribe((next) => {
      setSettings(next);
      try {
        setCurrentVersion(settingsService.computeSettingsVersion(next));
      } catch {}
    });

    return () => unsub();
  }, [isFocused]);

  // Load pay history when History tab is active
  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      if (topTab !== "history" || !isFocused) return;
      setLoadingHistory(true);
      const list = await settingsService.getPayHistory();
      setPayHistory(list);
      const v = await settingsService.getHistorySettingsVersion();
      setCurrentVersion(v);
      setLoadingHistory(false);
    };
    void loadHistory();
  }, [topTab, isFocused]);

  const handleHistoryUpdated = async (): Promise<void> => {
    const fresh = await settingsService.getPayHistory();
    setPayHistory(fresh);
    try {
      const v = await settingsService.getHistorySettingsVersion();
      setCurrentVersion(v);
    } catch {}
  };

  const handlePaySaved = (): void => {
    // Optionally reload history if on that tab
    if (topTab === "history") {
      void handleHistoryUpdated();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        {/* Top tab: Calculator | History */}
        <View style={Platform.OS === "web" ? styles.webMaxWidth : undefined}>
          <SegmentedSwitcher
            items={[
              { id: "calculator", label: "Calculator" },
              { id: "history", label: "History" },
            ]}
            activeId={topTab}
            onChange={(id) => setTopTab(id as TopTab)}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60,
            ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={Platform.OS === "web" ? styles.webMaxWidth : undefined}>
            {topTab === "calculator" ? (
              <PayCalculatorTab
                settings={settings}
                loadingSettings={loadingSettings}
                onPaySaved={handlePaySaved}
              />
            ) : (
              <PayHistoryTab
                settings={settings}
                payHistory={payHistory}
                loadingHistory={loadingHistory}
                currentVersion={currentVersion}
                onHistoryUpdated={handleHistoryUpdated}
              />
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  webMaxWidth: {
    maxWidth: 640,
    width: "100%",
  },
});
