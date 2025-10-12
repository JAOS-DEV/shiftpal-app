import ShiftPalLogo from "@/assets/images/shiftpal.svg";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/providers/AuthProvider";
import { authStyles as styles } from "@/styles/auth.styles";
import { notify } from "@/utils/notify";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { signUpWithEmail } = useAuth();
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
      await signUpWithEmail(email, password);
      notify.success("Account created");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to register");
      notify.error(
        "Registration failed",
        e instanceof Error ? e.message : undefined
      );
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
