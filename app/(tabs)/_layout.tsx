import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSettings } from "@/hooks/useSettings";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();

  // Get the appropriate currency icon based on user settings
  const getCurrencyIcon = (): string => {
    const currency = settings?.preferences?.currency || "GBP";
    switch (currency) {
      case "USD":
        return "dollarsign.circle.fill";
      case "EUR":
        return "eurosign.circle.fill";
      case "GBP":
      default:
        return "sterlingsign.circle.fill";
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payCalculator"
        options={{
          title: "Pay",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name={getCurrencyIcon()} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
          href: "/settings",
        }}
      />
    </Tabs>
  );
}
