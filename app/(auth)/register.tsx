import ShiftPalLogo from "@/assets/images/shiftpal.svg";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/providers/AuthProvider";
import { authStyles as styles } from "@/styles/auth.styles";
import { getAuthErrorMessage } from "@/utils/authErrorUtils";
import { notify } from "@/utils/notify";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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

  // TODO: Update these URLs once Privacy Policy and Terms are hosted
  const PRIVACY_POLICY_URL = "https://yourwebsite.com/privacy";
  const TERMS_OF_SERVICE_URL = "https://yourwebsite.com/terms";

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      notify.success("Account created");
    } catch (e: unknown) {
      const errorMessage = getAuthErrorMessage(e);
      setError(errorMessage);
      notify.error("Registration failed", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenLink = async (url: string, title: string): Promise<void> => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open ${title}`);
      }
    } catch (error) {
      console.error(`Error opening ${title}:`, error);
      Alert.alert("Error", `Failed to open ${title}`);
    }
  };

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

          {/* Privacy Policy & Terms */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By creating an account, you agree to our{" "}
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity
                onPress={() =>
                  handleOpenLink(TERMS_OF_SERVICE_URL, "Terms of Service")
                }
              >
                <Text style={[styles.legalLink, { color: theme.brandBg }]}>
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text style={styles.legalText}> and </Text>
              <TouchableOpacity
                onPress={() =>
                  handleOpenLink(PRIVACY_POLICY_URL, "Privacy Policy")
                }
              >
                <Text style={[styles.legalLink, { color: theme.brandBg }]}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
