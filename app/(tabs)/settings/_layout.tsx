import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="pay" />
      <Stack.Screen name="deductions" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="account" />
    </Stack>
  );
}
