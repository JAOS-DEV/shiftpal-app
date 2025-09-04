import ShiftPalLogo from "@/assets/images/shiftpal.svg";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/providers/AuthProvider";
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

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] as any;
  const { signUpWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
    } catch (e: any) {
      setError(e?.message ?? "Failed to register");
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
              {loading ? "Creating..." : "Create account"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: theme.brandBg }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={[styles.outlineButtonText, { color: theme.brandBg }]}>
              I already have an account
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
  outlineButton: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 16,
  },
  outlineButtonText: { fontWeight: "700" },
});
