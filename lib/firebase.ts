import Constants from "expo-constants";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  browserLocalPersistence,
  getAuth,
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

export function getFirebase() {
  if (!getApps().length) {
    app = initializeApp(getFirebaseConfig());
  } else {
    app = getApp();
  }

  if (Platform.OS === "web") {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence);
  } else {
    // Expo Go native: use default in-memory auth; avoids native persistence module requirements
    auth = getAuth(app);
  }

  firestore = getFirestore(app);

  return { app, auth, firestore };
}

export type { Auth, Firestore };
