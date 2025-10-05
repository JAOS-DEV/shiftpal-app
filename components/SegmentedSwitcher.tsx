import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export interface SegmentedItem {
  id: string;
  label: string;
  showDot?: boolean;
}

interface SegmentedSwitcherProps {
  items: SegmentedItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export function SegmentedSwitcher({
  items,
  activeId,
  onChange,
}: SegmentedSwitcherProps): React.JSX.Element {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.tab, activeId === item.id && styles.activeTab]}
            onPress={() => onChange(item.id)}
            accessibilityLabel={`${item.label} tab`}
          >
            <View style={styles.tabLabelWrap}>
              <ThemedText
                style={[
                  styles.tabText,
                  activeId === item.id && styles.activeTabText,
                ]}
              >
                {item.label}
              </ThemedText>
              {item.showDot && <View style={styles.dot} />}
            </View>
          </TouchableOpacity>
        ))}
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
  activeTab: {
    backgroundColor: "white",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabelWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
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
