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

## 🔥 Firebase Setup (Required)

### Quick Setup

1. **Create a Firebase project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable **Email/Password** authentication in Authentication > Sign-in method

2. **Get your Firebase config**:
   - Go to Project Settings > Your apps
   - Add a Web app
   - Copy the configuration values

3. **Configure environment variables** (Recommended):
   
   Create a `.env` file in the project root:

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

   **Alternative**: Put values in `app.json` under `expo.extra.firebase` (not recommended for production)

4. **Restart the development server**:
   ```bash
   npx expo start --clear
   ```

### Usage

- Navigate to `/(auth)/register` to create an account
- Navigate to `/(auth)/login` to sign in
- The app uses Firebase Authentication with persistence

## 📱 iOS App Store Launch

See [IOS_LAUNCH_CHECKLIST.md](./IOS_LAUNCH_CHECKLIST.md) for a comprehensive guide on:
- Required configuration changes
- Asset preparation
- App Store Connect setup
- Testing checklist
- Submission process
