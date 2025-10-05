import ShiftPalLogo from "@/assets/images/shiftpal.svg";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/providers/AuthProvider";
import { notify } from "@/utils/notify";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLoading = loading;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      notify.success("Logged in");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to sign in");
      notify.error("Login failed", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["#FFFFFF", "#F3F4F6"]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <ShiftPalLogo width={72} height={72} />
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingLine} />
              <View style={styles.loadingInput} />
              <View style={styles.loadingInput} />
            </View>
          ) : null}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.brandBg }]}
            onPress={onSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Log in..." : "Log in"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.linkMuted}>Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: theme.brandBg }]}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={[styles.outlineButtonText, { color: theme.brandBg }]}>
              Create new account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1, paddingHorizontal: 20 },
  scroll: { flexGrow: 1, justifyContent: "center", gap: 12 },
  logoWrap: { alignItems: "center", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    // Use boxShadow for web compatibility
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    // Keep shadow properties for React Native
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  error: { color: "#ef4444", textAlign: "center" },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  linkMuted: { color: "#374151", textAlign: "center", marginTop: 8 },
  outlineButton: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 16,
  },
  outlineButtonText: { fontWeight: "700" },
  loadingContainer: {
    gap: 10,
  },
  loadingLine: {
    height: 16,
    backgroundColor: "#EDEDED",
    borderRadius: 8,
  },
  loadingInput: {
    height: 48,
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
  },
});
