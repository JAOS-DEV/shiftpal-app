import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

type LegacyTab = "tracker" | "history";

interface TabSwitcherProps {
  // Legacy usage (defaults to tracker/history)
  activeTab?: LegacyTab;
  onTabChange?: (tab: LegacyTab) => void;
  showTrackerDot?: boolean;
  // Custom tabs usage
  tabs?: { key: string; label: string }[];
  activeKey?: string;
  onKeyChange?: (key: string) => void;
}

export function TabSwitcher({
  activeTab,
  onTabChange,
  showTrackerDot,
  tabs,
  activeKey,
  onKeyChange,
}: TabSwitcherProps): React.JSX.Element {
  const isCustom = Array.isArray(tabs) && tabs.length > 0;

  const handleKeyChange = useCallback(
    (key: string) => {
      onKeyChange?.(key);
    },
    [onKeyChange]
  );

  const handleTrackerTabChange = useCallback(() => {
    onTabChange?.("tracker");
  }, [onTabChange]);

  const handleHistoryTabChange = useCallback(() => {
    onTabChange?.("history");
  }, [onTabChange]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabContainer}>
        {isCustom ? (
          tabs!.map((t) => {
            const isActive = activeKey === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => handleKeyChange(t.key)}
                accessibilityLabel={`${t.label} tab`}
              >
                <ThemedText
                  style={[styles.tabText, isActive && styles.activeTabText]}
                >
                  {t.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })
        ) : (
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === "tracker" && styles.activeTab]}
              onPress={handleTrackerTabChange}
              accessibilityLabel="Shift tracker tab"
            >
              <View style={styles.tabLabelWrap}>
                <ThemedText
                  style={[
                    styles.tabText,
                    activeTab === "tracker" && styles.activeTabText,
                  ]}
                >
                  Tracker
                </ThemedText>
                {showTrackerDot && <View style={styles.dot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "history" && styles.activeTab]}
              onPress={handleHistoryTabChange}
              accessibilityLabel="History tab"
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "history" && styles.activeTabText,
                ]}
              >
                History
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabLabelWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "white",
    // Use boxShadow for web compatibility
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    // Keep shadow properties for React Native
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    includeFontPadding: false,
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  dot: {
    position: "absolute",
    top: -3,
    right: -18,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
});
