import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  setPersistence,
} from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

type FirebaseConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
};

function getFirebaseConfig(): FirebaseConfig {
  // Prefer EXPO_PUBLIC_* envs if provided, else fallback to app.json extra
  const envConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } as Record<string, string | undefined>;

  const requiredKeys: Array<
    keyof FirebaseConfig | "messagingSenderId" | "authDomain" | "storageBucket"
  > = [
    "apiKey",
    "projectId",
    "appId",
    "authDomain",
    "storageBucket",
    "messagingSenderId",
  ];

  const missing = requiredKeys.filter((k) => !envConfig[k]);

  if (missing.length === 0) {
    return envConfig as FirebaseConfig;
  }

  const extra =
    (Constants?.expoConfig as any)?.extra?.firebase ||
    (Constants as any)?.manifest?.extra?.firebase;

  if (!extra) {
    throw new Error(
      "Missing Firebase configuration. Set EXPO_PUBLIC_* envs or app.json extra.firebase."
    );
  }

  return extra as FirebaseConfig;
}

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let analyticsInstance: any | undefined;

export function getFirebase() {
  // Initialize app if not already initialized
  if (!getApps().length) {
    app = initializeApp(getFirebaseConfig());
  } else {
    app = getApp();
  }

  // Initialize auth only once
  if (!auth) {
    if (Platform.OS === "web") {
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence);
      void initWebAnalytics();
    } else {
      // React Native: use AsyncStorage for auth persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  }

  // Initialize firestore only once
  if (!firestore) {
    firestore = getFirestore(app);
  }

  return { app, auth, firestore };
}

export type { Auth, Firestore };

export async function initWebAnalytics() {
  if (Platform.OS !== "web") return undefined;
  try {
    const { isSupported, getAnalytics } = await import("firebase/analytics");
    const supported = await isSupported();
    if (!supported) return undefined;
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (e) {
    return undefined;
  }
}

export async function logAnalyticsEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (Platform.OS !== "web") return;
  if (!analyticsInstance) {
    await initWebAnalytics();
  }
  if (!analyticsInstance) return;
  const { logEvent } = await import("firebase/analytics");
  logEvent(analyticsInstance, eventName, params);
}
