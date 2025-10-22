<!-- 9398f701-c614-4292-b5e3-911e2403df4b d4c8738e-6dcb-4bb6-b208-c94f8fd81661 -->
# Freemium Data Structure & Subscription System Implementation

## Overview

Transform ShiftPal into a freemium cross-platform app by adding subscription tiers, usage tracking, feature flags, and making cloud sync a premium feature while maintaining the existing local-first architecture.

## Implementation Steps

### 1. Create Core Subscription Types

**File**: `types/subscription.ts` (new file)

Define TypeScript interfaces for:

- `SubscriptionTier`: 'free' | 'premium'
- `SubscriptionStatus`: 'active' | 'expired' | 'trial' | 'cancelled' | 'none'
- `Platform`: 'ios' | 'android' | 'web'
- `UserProfile` interface with subscription details
- `UsageMetrics` interface for tracking free tier limits
- `FeatureFlags` interface for tier-based access control
- `PurchaseReceipt` interface for platform-specific receipts

### 2. Define Freemium Feature Limits

**File**: `constants/FeatureLimits.ts` (new file)

Create constants object defining:

- Free tier: 2 pay rates, 10 calculations/month, 30 days history, basic overtime only
- Premium tier: unlimited everything
- Feature availability per tier (night shift, weekend, tax/NI, cloud sync, export)

### 3. Create Subscription Service

**File**: `services/subscriptionService.ts` (new file)

Implement `SubscriptionService` class with methods:

- `getUserProfile()`: Load user subscription data from AsyncStorage + Firestore
- `saveUserProfile()`: Save profile locally and sync if premium
- `checkFeatureAccess()`: Validate if user can access a feature
- `getUsageMetrics()`: Track monthly shifts, calculations, pay rates
- `incrementUsage()`: Update usage counters
- `resetMonthlyUsage()`: Reset counters at month start
- `canPerformAction()`: Check against usage limits
- `upgradeToPremium()`: Handle subscription activation
- `downgradeToFree()`: Handle subscription cancellation/expiry
- Subscribe/unsubscribe pattern for profile changes

### 4. Update Settings Types for Feature Flags

**File**: `types/settings.ts`

Add optional field to `AppSettings`:

- `restrictedFeatures?: string[]`: List of features disabled for free tier

### 5. Modify Settings Service for Tier Restrictions

**File**: `services/settingsService.ts`

Update methods to enforce limits:

- `addPayRate()`: Check `canPerformAction('addPayRate')` before adding
- `saveSettings()`: Validate premium features aren't enabled on free tier
- `computePay()`: Skip night/weekend/tax/NI calculations if not premium
- `savePayCalculation()`: Check monthly calculation limit
- Add `validateSettingsForTier()` method to strip premium features for free users
- Update `syncToFirebase()` calls to check if user has premium (cloud sync privilege)

### 6. Update Shift Service for Sync Control

**File**: `services/shiftService.ts`

Modify Firebase sync methods:

- `syncToFirebase()`: Check subscription tier before syncing
- `loadFromFirebase()`: Only load if premium user
- Add warning logs when sync is skipped for free tier
- Update `getSubmittedDays()` to respect 30-day limit for free tier

### 7. Create User Profile Provider

**File**: `providers/SubscriptionProvider.tsx` (new file)

Create React context provider:

- Load user profile on mount
- Expose `userProfile`, `featureFlags`, `usageMetrics`
- Provide helper functions: `hasFeature()`, `canUseFeature()`, `getRemainingUsage()`
- Subscribe to profile changes
- Auto-refresh on subscription status changes

### 8. Create Feature Gate Component

**File**: `components/FeatureGate.tsx` (new file)

Reusable component to wrap premium features:

- Props: `feature: string`, `fallback?: ReactNode`, `showUpgradePrompt?: boolean`
- Checks feature access via SubscriptionProvider
- Shows upgrade prompt or fallback for free users
- Integrates with upgrade modal

### 9. Create Upgrade Prompt Modal

**File**: `components/UpgradeModal.tsx` (new file)

Premium upgrade UI:

- Display premium features list
- Pricing information (monthly/annual)
- Call-to-action button
- Integration point for RevenueCat/IAP (to be implemented later)
- "Restore Purchases" button
- Close/dismiss handling

### 10. Add Feature Limits to Pay Rates Section

**File**: `components/settings/PayRatesSection.tsx`

Update UI:

- Show "X/2 pay rates" for free tier users
- Disable "Add Rate" button when limit reached
- Add upgrade prompt when limit exceeded
- Display premium badge on unlimited access

### 11. Add Feature Limits to Pay Calculator

**File**: `components/pay-calculator/PayCalculatorTab.tsx`

Update calculation flow:

- Check calculation limit before saving
- Show "X/10 calculations this month" for free users
- Disable premium inputs (night hours, weekend toggle) for free tier
- Add upgrade prompts on premium feature interaction
- Grey out/hide tax and NI sections for free users

### 12. Restrict Advanced Settings for Free Tier

**Files**:

- `components/settings/NightEditModal.tsx`
- `components/settings/WeekendEditModal.tsx`
- `components/settings/TaxSettingsSection.tsx`
- `components/settings/NiSettingsSection.tsx`
- `components/settings/AllowancesSettingsSection.tsx`

Wrap each in `<FeatureGate>`:

- Show "Premium Feature" badge
- Disable editing for free users
- Add inline upgrade prompts

### 13. Add Usage Tracking to Shift Submission

**File**: `services/shiftService.ts`

Update `submitDay()`:

- Call `subscriptionService.incrementUsage('shiftsTracked')`
- Update monthly shift counter
- Respect 30-day history limit for free tier in `getSubmittedDays()`

### 14. Update Pay Calculator History Limits

**File**: `components/pay-calculator/PayHistoryTab.tsx`

Enforce limits:

- Filter to 30-day history for free users
- Show upgrade prompt to access full history
- Display history limit indicator

### 15. Add Cloud Sync Status Indicator

**File**: `components/settings/AdvancedSection.tsx`

Add sync status section:

- Show "Cloud Sync: Premium Only" for free users
- Show "Cloud Sync: Active" with last sync time for premium
- Add upgrade prompt for cloud sync
- Display sync toggle (disabled for free tier)

### 16. Create Subscription Settings Screen

**File**: `app/(tabs)/settings/subscription.tsx` (new file)
**File**: `components/settings/SubscriptionSection.tsx` (new file)

New settings page:

- Display current tier (Free/Premium)
- Show usage metrics for free tier
- Manage subscription button
- Restore purchases button
- Subscription status and renewal date (premium)
- Premium features list
- Upgrade/downgrade actions

### 17. Update Root Layout for Subscription Provider

**File**: `app/_layout.tsx`

Wrap app in SubscriptionProvider:

- Add provider above navigation
- Ensure it's below AuthProvider
- Handle loading state

### 18. Add Subscription Link to Settings Index

**File**: `app/(tabs)/settings/index.tsx`

Add navigation item:

- "Subscription & Billing" option
- Show current tier badge
- Link to subscription settings page

### 19. Initialize Default User Profile on Registration

**File**: `providers/AuthProvider.tsx`

Update `signUpWithEmail()`:

- Create default free tier user profile
- Initialize usage metrics
- Save to AsyncStorage and Firestore
- Set subscription status to 'none'

### 20. Create Migration Helper for Existing Users

**File**: `services/migrationService.ts` (new file)

Handle existing users:

- Detect users without subscription data
- Create default free tier profile
- Optionally: Grant temporary premium trial
- One-time migration on app load

### 21. Add Firestore Security Rules (Documentation)

**File**: `docs/FIRESTORE_SECURITY_RULES.md` (new file)

Document required Firestore rules:

- Users can only read/write their own data
- Premium users can write to days/payHistory collections
- Free users can read but not write (local-only)
- Profile validation rules

### 22. Update Settings Layout for Subscription Nav

**File**: `app/(tabs)/settings/_layout.tsx`

Add subscription route to stack navigator

### 23. Add Feature Access Checks to Exports (Future-Ready)

**File**: `utils/exportData.ts` (prepare for future)

Add placeholder checks for export functionality:

- Stub `exportToCSV()` with premium check
- Stub `exportToPDF()` with premium check
- Show upgrade prompt when called by free users

### 24. Create Onboarding Welcome Screen (Future Enhancement)

**File**: `components/OnboardingModal.tsx` (new file)

First-launch experience:

- Welcome message
- Free vs Premium feature comparison
- Optional trial offer
- "Start Free" or "Try Premium" CTA

## Key Files to Create

1. `types/subscription.ts` - Core subscription types
2. `constants/FeatureLimits.ts` - Tier limits configuration
3. `services/subscriptionService.ts` - Subscription business logic
4. `providers/SubscriptionProvider.tsx` - React context
5. `components/FeatureGate.tsx` - Feature access wrapper
6. `components/UpgradeModal.tsx` - Upgrade UI
7. `app/(tabs)/settings/subscription.tsx` - Subscription screen
8. `components/settings/SubscriptionSection.tsx` - Subscription settings
9. `services/migrationService.ts` - User data migration
10. `docs/FIRESTORE_SECURITY_RULES.md` - Security documentation

## Key Files to Modify

1. `services/settingsService.ts` - Add tier validation
2. `services/shiftService.ts` - Add usage tracking & sync control
3. `components/settings/PayRatesSection.tsx` - Add limits
4. `components/pay-calculator/PayCalculatorTab.tsx` - Add restrictions
5. `app/_layout.tsx` - Add provider
6. `app/(tabs)/settings/index.tsx` - Add nav item
7. `providers/AuthProvider.tsx` - Initialize profiles
8. Various settings components - Add feature gates

## Testing Checklist

- [ ] Free user cannot add more than 2 pay rates
- [ ] Free user cannot save more than 10 calculations per month
- [ ] Free user cannot access night/weekend/tax settings
- [ ] Premium user has unlimited access
- [ ] Cloud sync disabled for free, enabled for premium
- [ ] Usage counters reset monthly
- [ ] Feature gates show upgrade prompts
- [ ] Existing users migrated to free tier
- [ ] New signups start as free tier

## Future Integration Points

- **RevenueCat SDK**: Replace stub purchase flow with actual IAP
- **Firebase Cloud Functions**: Server-side receipt validation
- **Analytics**: Track conversion funnel free → premium
- **Remote Config**: A/B test pricing and trial lengths

### To-dos

- [ ] Create types/subscription.ts with core subscription interfaces
- [ ] Create constants/FeatureLimits.ts defining free vs premium limits
- [ ] Create services/subscriptionService.ts with tier management logic
- [ ] Create providers/SubscriptionProvider.tsx React context
- [ ] Create components/FeatureGate.tsx reusable wrapper component
- [ ] Create components/UpgradeModal.tsx premium upsell UI
- [ ] Update settingsService.ts to enforce tier restrictions and validate premium features
- [ ] Update shiftService.ts to control cloud sync by tier and track usage
- [ ] Update PayRatesSection.tsx to show limits and restrict adding rates for free tier
- [ ] Update PayCalculatorTab.tsx to restrict premium features and show calculation limits
- [ ] Wrap night/weekend/tax/NI/allowances settings in FeatureGate components
- [ ] Create app/(tabs)/settings/subscription.tsx and SubscriptionSection component
- [ ] Update app/_layout.tsx to wrap app in SubscriptionProvider
- [ ] Update settings index and layout to include subscription navigation
- [ ] Update AuthProvider.tsx to initialize user profiles on signup
- [ ] Create migrationService.ts to handle existing users without subscription data
- [ ] Create docs/FIRESTORE_SECURITY_RULES.md with security rules documentation
- [ ] Update AdvancedSection.tsx to show cloud sync status based on tier