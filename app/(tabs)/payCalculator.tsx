import { SegmentedSwitcher } from "@/components/SegmentedSwitcher";
import { ThemedView } from "@/components/ThemedView";
import { PayCalculatorTab } from "@/components/pay-calculator/PayCalculatorTab";
import { PayHistoryTab } from "@/components/pay-calculator/PayHistoryTab";
import { useAuth } from "@/providers/AuthProvider";
import { settingsService } from "@/services/settingsService";
import { AppSettings, PayCalculationEntry } from "@/types/settings";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
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

export default function PayCalculatorScreen(): React.JSX.Element {
  const { user } = useAuth();
  const [topTab, setTopTab] = useState<TopTab>("calculator");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [payHistory, setPayHistory] = useState<PayCalculationEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Manual rate state lifted to persist across tab switches
  const [manualBaseRateText, setManualBaseRateText] = useState<string>("");
  const [manualOvertimeRateText, setManualOvertimeRateText] =
    useState<string>("");

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Memoize manual rate change handlers to prevent unnecessary re-renders
  const handleManualBaseRateTextChange = useCallback((value: string) => {
    setManualBaseRateText(value);
  }, []);

  const handleManualOvertimeRateTextChange = useCallback((value: string) => {
    setManualOvertimeRateText(value);
  }, []);

  // Reset manual rates when user changes (logout/login)
  useEffect(() => {
    setManualBaseRateText("");
    setManualOvertimeRateText("");
  }, [user?.uid]);

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
      setLoadingHistory(false);
    };
    void loadHistory();
  }, [topTab, isFocused]);

  const handleHistoryUpdated = async (): Promise<void> => {
    const fresh = await settingsService.getPayHistory();
    setPayHistory(fresh);
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

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 60,
              ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
            }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={Platform.OS === "web" ? styles.webMaxWidth : undefined}
            >
              {topTab === "calculator" ? (
                <PayCalculatorTab
                  settings={settings}
                  loadingSettings={loadingSettings}
                  onPaySaved={handlePaySaved}
                  manualBaseRateText={manualBaseRateText}
                  manualOvertimeRateText={manualOvertimeRateText}
                  onManualBaseRateTextChange={handleManualBaseRateTextChange}
                  onManualOvertimeRateTextChange={
                    handleManualOvertimeRateTextChange
                  }
                />
              ) : (
                <PayHistoryTab
                  settings={settings}
                  payHistory={payHistory}
                  loadingHistory={loadingHistory}
                  onHistoryUpdated={handleHistoryUpdated}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
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
