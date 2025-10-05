import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
