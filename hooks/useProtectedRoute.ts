import { useRouter, useSegments } from "expo-router";
import type { User } from "firebase/auth";
import { useEffect } from "react";

export function useProtectedRoute(user: User | null, initializing: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, initializing, segments, router]);
}
