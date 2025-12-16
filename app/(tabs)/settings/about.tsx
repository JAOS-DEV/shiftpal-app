import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/providers/ThemeProvider";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/**
 * About screen displaying app information, legal links, and support contact
 */
export default function AboutScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // TODO: Update these URLs once Privacy Policy and Terms are hosted
  const PRIVACY_POLICY_URL = "https://yourwebsite.com/privacy";
  const TERMS_OF_SERVICE_URL = "https://yourwebsite.com/terms";
  const SUPPORT_EMAIL = "support@shiftpal.app"; // TODO: Update with your email
  const WEBSITE_URL = "https://shiftpal.app"; // TODO: Update with your website

  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || "1";

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

  const handleEmailSupport = async (): Promise<void> => {
    const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=ShiftPal Support Request`;
    await handleOpenLink(emailUrl, "email");
  };

  interface LinkItemProps {
    title: string;
    onPress: () => void;
    description?: string;
  }

  const LinkItem: React.FC<LinkItemProps> = ({
    title,
    onPress,
    description,
  }) => (
    <TouchableOpacity
      style={[styles.linkItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.linkContent}>
        <ThemedText style={styles.linkTitle}>{title}</ThemedText>
        {description && (
          <ThemedText
            style={[styles.linkDescription, { color: colors.textSecondary }]}
          >
            {description}
          </ThemedText>
        )}
      </View>
      <ThemedText style={[styles.linkArrow, { color: colors.textSecondary }]}>
        →
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ThemedView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60,
            ...(Platform.OS === "web" ? { alignItems: "center" } : {}),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.container,
              Platform.OS === "web" && {
                width: "100%",
                maxWidth: 1200,
                alignSelf: "center",
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol
                  name="chevron.left"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <ThemedText
                type="title"
                style={[styles.title, { color: colors.text }]}
              >
                About
              </ThemedText>
            </View>

            {/* App Info */}
            <View style={[styles.section, styles.firstSection]}>
              <View style={styles.logoContainer}>
                <ThemedText style={styles.appName}>ShiftPal</ThemedText>
                <ThemedText
                  style={[styles.tagline, { color: colors.textSecondary }]}
                >
                  Track shifts, calculate pay
                </ThemedText>
              </View>

              <View
                style={[
                  styles.versionCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.versionRow}>
                  <ThemedText
                    style={[
                      styles.versionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Version
                  </ThemedText>
                  <ThemedText style={styles.versionValue}>
                    {appVersion} ({buildNumber})
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Legal Links */}
            <View style={styles.section}>
              <ThemedText
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                LEGAL
              </ThemedText>

              <LinkItem
                title="Privacy Policy"
                description="How we handle your data"
                onPress={() =>
                  handleOpenLink(PRIVACY_POLICY_URL, "Privacy Policy")
                }
              />

              <LinkItem
                title="Terms of Service"
                description="Terms and conditions of use"
                onPress={() =>
                  handleOpenLink(TERMS_OF_SERVICE_URL, "Terms of Service")
                }
              />
            </View>

            {/* Support */}
            <View style={styles.section}>
              <ThemedText
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                SUPPORT
              </ThemedText>

              <LinkItem
                title="Contact Support"
                description={SUPPORT_EMAIL}
                onPress={handleEmailSupport}
              />

              <LinkItem
                title="Website"
                description="Visit our website"
                onPress={() => handleOpenLink(WEBSITE_URL, "website")}
              />
            </View>

            {/* Credits */}
            <View style={styles.section}>
              <ThemedText
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                CREDITS
              </ThemedText>

              <View
                style={[
                  styles.creditsCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <ThemedText
                  style={[styles.creditsText, { color: colors.textSecondary }]}
                >
                  Made with ❤️ for shift workers everywhere
                </ThemedText>
                <ThemedText
                  style={[styles.creditsText, { color: colors.textSecondary }]}
                >
                  © {new Date().getFullYear()} ShiftPal
                </ThemedText>
              </View>
            </View>

            {/* Developer Info (Optional - Remove in production if desired) */}
            <View style={[styles.section, styles.lastSection]}>
              <ThemedText
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                BUILT WITH
              </ThemedText>

              <View
                style={[styles.techCard, { backgroundColor: colors.surface }]}
              >
                <ThemedText
                  style={[styles.techText, { color: colors.textSecondary }]}
                >
                  React Native • Expo • Firebase • TypeScript
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    marginLeft: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  section: {
    marginBottom: 20,
  },
  firstSection: {
    marginTop: 8,
  },
  lastSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  logoContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
  },
  versionCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  versionLabel: {
    fontSize: 16,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 20,
    marginLeft: 12,
  },
  creditsCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  creditsText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  techCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  techText: {
    fontSize: 13,
    textAlign: "center",
  },
});
