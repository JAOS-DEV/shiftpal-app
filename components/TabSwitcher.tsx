import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

type Tab = "tracker" | "history";

interface TabSwitcherProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  showTrackerDot?: boolean;
}

export function TabSwitcher({
  activeTab,
  onTabChange,
  showTrackerDot,
}: TabSwitcherProps) {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tracker" && styles.activeTab]}
          onPress={() => onTabChange("tracker")}
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
          onPress={() => onTabChange("history")}
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
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
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
