# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Firebase Email/Password Auth Setup

1. Create a Firebase project and enable Email/Password provider in Authentication.

2. Add a Web app in Firebase Settings and copy config values.

3. Configure env vars (preferred) in a `.env` file at the project root:

```
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

Then run:

```
npx expo start --clear
```

Alternatively, put values in `app.json` under `expo.extra.firebase`:

```json
{
  "expo": {
    "extra": {
      "firebase": {
        "apiKey": "YOUR_API_KEY",
        "authDomain": "YOUR_AUTH_DOMAIN",
        "projectId": "YOUR_PROJECT_ID",
        "storageBucket": "YOUR_STORAGE_BUCKET",
        "messagingSenderId": "YOUR_SENDER_ID",
        "appId": "YOUR_APP_ID"
      }
    }
  }
}
```

4. Run the app and use the auth screens:

- `/(auth)/register` to create an account
- `/(auth)/login` to sign in

The app uses an AuthProvider with persistence (web localStorage, native AsyncStorage) and protects routes via Expo Router segments.
