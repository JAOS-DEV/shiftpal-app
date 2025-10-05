# iOS App Store Launch Checklist

## ✅ Fixed Issues

### 1. Deprecated Style Props
- ✅ Fixed `shadow*` props by adding `boxShadow` for web compatibility
  - Updated: `HistoryList.tsx`, `SubmitButton.tsx`, `TabSwitcher.tsx`, `login.tsx`, `register.tsx`
- ✅ Fixed deprecated `pointerEvents` prop by moving to inline styles
  - Updated: `SettingsPage.tsx`

### 2. iOS Configuration
- ✅ Added `bundleIdentifier` to `app.json`
- ✅ Added privacy descriptions (Info.plist entries)
- ✅ Added privacy manifests configuration

### 3. Date Selector Fix (iOS)
- ✅ Fixed date picker not allowing selection of past dates
  - Updated: `DatePicker.tsx`
  - Users can now select any past date to log shifts
  - Future dates remain disabled (as intended)

## 🔧 Setup Required

### Firebase Configuration

**Option 1: Using Environment Variables (Recommended for security)**

1. Create a `.env` file in the project root (already in `.gitignore`):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

2. Get these values from [Firebase Console](https://console.firebase.google.com/):
   - Go to Project Settings > Your apps > Web app
   - Copy the configuration values

3. Restart the development server:
```bash
npx expo start --clear
```

**Option 2: Direct in app.json (Not recommended for production)**

Replace the placeholder values in `app.json` under `expo.extra.firebase` with your actual Firebase configuration.

## 📋 Pre-Launch Checklist

### App Configuration

- [ ] **Update Bundle Identifier**: Change `com.yourcompany.shiftpal` to your actual bundle ID in `app.json`
- [ ] **Set up Firebase**: Follow the Firebase configuration steps above
- [ ] **Update App Display Name**: Set `"name"` in `app.json` to your desired app name
- [ ] **Privacy Policy**: Prepare a privacy policy URL if collecting user data
- [ ] **Terms of Service**: Prepare terms of service if needed

### Assets & Icons

- [ ] **App Icon**: Verify `./assets/images/icon.png` is 1024x1024px
- [ ] **Adaptive Icon**: Verify `./assets/images/adaptive-icon.png` meets requirements
- [ ] **Splash Screen**: Verify `./assets/images/splash-icon.png` is properly sized
- [ ] **Screenshots**: Prepare App Store screenshots for all required device sizes:
  - iPhone 6.7" (1290 x 2796)
  - iPhone 6.5" (1242 x 2688)
  - iPhone 5.5" (1242 x 2208)
  - iPad Pro 12.9" (2048 x 2732)

### App Store Connect

- [ ] **Create App Store Connect account** at [App Store Connect](https://appstoreconnect.apple.com/)
- [ ] **Enroll in Apple Developer Program** ($99/year)
- [ ] **Create App ID** matching your bundle identifier
- [ ] **Prepare App Store Listing**:
  - App name
  - Subtitle
  - Description
  - Keywords
  - Support URL
  - Marketing URL (optional)
  - Category (Business or Productivity)
  - Age rating

### Legal & Compliance

- [ ] **Privacy Policy**: Required if using Firebase or collecting any user data
- [ ] **GDPR Compliance**: If targeting EU users
- [ ] **Data Collection Disclosure**: Declare what data you collect in App Store Connect
- [ ] **Export Compliance**: Required for apps using encryption (most Firebase apps)

### Testing

- [ ] **Test on Physical iOS Device**: Use TestFlight or development build
- [ ] **Test Authentication Flow**: Register, login, logout
- [ ] **Test All Features**: Shift tracking, pay calculator, settings
- [ ] **Test Dark/Light Mode**: Ensure UI works in both themes
- [ ] **Test Offline Behavior**: Ensure graceful handling of no internet
- [ ] **Test Edge Cases**: Invalid inputs, network errors, etc.

### Build & Submit

1. **Configure EAS Build** (if using EAS):
```bash
npm install -g eas-cli
eas login
eas build:configure
```

2. **Create Production Build**:
```bash
eas build --platform ios --profile production
```

3. **Submit to App Store**:
```bash
eas submit --platform ios
```

Or manually upload via Xcode or Transporter app.

## 📱 iOS-Specific Considerations

### Current Configuration

- ✅ New Architecture enabled (`newArchEnabled: true`)
- ✅ Tablet support enabled
- ✅ Portrait orientation only
- ✅ Automatic theme (supports dark mode)

### Recommended Updates

1. **Bundle Identifier**: Must be unique (e.g., `com.yourcompany.shiftpal`)
2. **Version Management**: 
   - `version`: User-facing version (1.0.0)
   - `ios.buildNumber`: Internal build number (increment with each submission)

3. **Privacy Descriptions**: Already added placeholders. Update if you add features that use:
   - Camera
   - Photo Library
   - Location Services
   - Contacts
   - Microphone
   - Calendar/Reminders

## 🚀 Next Steps

1. **Set up Firebase** using the steps above to fix the current errors
2. **Test the app** on a real iOS device
3. **Update the bundle identifier** in `app.json`
4. **Prepare marketing materials** (screenshots, description, etc.)
5. **Create App Store Connect listing**
6. **Build and submit** using EAS or Xcode

## 📚 Resources

- [Expo iOS Builds](https://docs.expo.dev/build/ios/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## ⚠️ Common Issues

### Firebase Errors
If you see "API key not valid" errors, your Firebase configuration is not set up correctly. Follow the Firebase Configuration section above.

### Build Failures
- Ensure all dependencies are compatible with the new architecture
- Check that your bundle identifier is properly configured
- Verify provisioning profiles and certificates in App Store Connect

### Rejection Reasons
- Missing privacy policy
- Incomplete metadata
- Bugs or crashes
- Misleading screenshots or description
- Missing required device screenshots

