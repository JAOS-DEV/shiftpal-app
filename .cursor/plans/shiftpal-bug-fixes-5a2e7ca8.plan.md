<!-- 5a2e7ca8-b20d-431e-8e7a-311bba5e86b3 89695f42-faac-492d-add9-cb4dafe4406a -->

# ShiftPal Bug Fixes and Enhancements

## ✅ 1. Change Default Week Start Day to Monday (COMPLETED)

**Files:** `services/settingsService.ts`

- Line 43: Verified `startDay: "Monday"` is set correctly ✅

## ✅ 2. Add Note Support in Manual Mode (COMPLETED)

**Files:**

- `components/shift-input/ManualModeInput.tsx`
- `services/shiftService.ts`

Note modal and state management implemented. ManualModeInput now supports note parameter. ✅

## ✅ 3. Fix Timer Mode Break Display (COMPLETED)

**Files:**

- `hooks/useTimer.ts`
- `components/shift-input/BreakHistory.tsx`

Verified break time calculation in useTimer - currentBreakMs and totalBreakMs are properly computed. The existing code correctly calculates durationMs for each pause. ✅

## ✅ 4. Implement Edit Functionality for Tracker History (COMPLETED)

**Files:**

- `components/history/SubmissionBlock.tsx` (lines 169-178)
- Create new `components/history/EditSubmissionModal.tsx`
- `services/shiftService.ts` (add updateSubmission method)

Created EditSubmissionModal.tsx with full editing capabilities including proper DatePicker integration and reusable TimeInput component with full validation, auto-formatting, and auto-focus progression. Added updateSubmission and deleteSubmission methods to shiftService. Wired up Edit button in SubmissionBlock Actions menu. Fixed UI refresh issue by adding onSubmissionUpdated callback to HistoryList in HomeScreen. Fixed keyboard covering input fields by adding KeyboardAvoidingView to both EditSubmissionModal and DuplicateSubmissionModal. ✅

## ✅ 5. Implement Duplicate Functionality for Tracker History (COMPLETED)

**Files:**

- `components/history/SubmissionBlock.tsx` (lines 179-190)
- Create new `components/history/DuplicateSubmissionModal.tsx`
- `services/shiftService.ts` (use existing submitDay)

Created DuplicateSubmissionModal.tsx for copying submissions to new dates with proper DatePicker integration. Wired up Duplicate button in SubmissionBlock Actions menu. ✅

## ✅ 6. Remove Premium Pay Rate Type (COMPLETED)

**Files to update:**

- `types/settings.ts` (line 1: change PayRateType to "base" | "overtime")
- `components/settings/PayRatesSection.tsx` (lines 98-102: remove premium option)
- `components/pay-calculator/PayCalculatorTab.tsx` (lines 348-353: remove premium filter)
- `services/settingsService.ts` (any premium references)

Removed all premium references from the codebase. Updated PayRateType interface and all UI components. ✅

## ✅ 7. Refactor Pay Calculator Terminology: Base → Standard (COMPLETED)

**Files:**

- Search and replace "Base" with "Standard" in pay-related UI components
- `components/settings/PayRatesSection.tsx`
- `components/pay-calculator/PayRatesInput.tsx`
- `components/pay-calculator/PayHoursInput.tsx`
- `components/pay-calculator/PayBreakdownCard.tsx`
- Keep internal code using "base" for consistency

Updated all UI text from "Base" to "Standard" while keeping internal code using "base" for consistency. ✅

## ✅ 8. Pay Calculator Tracker Mode Enhancements (COMPLETED)

**Files:**

- `components/pay-calculator/PayCalculatorTab.tsx`
- `components/pay-calculator/PayBreakdownCard.tsx`

Added inline warning when no pay rate is set but shifts exist for the selected date. Added hours breakdown with rates in Total Pay section showing "Standard 1:30 @ £10.00" format. ✅

## ✅ 9. Fix Tax and NI Deduction Toggle Bug (COMPLETED)

**Files:**

- `services/settingsService.ts` (lines 512-530)
- `components/settings/TaxSettingsSection.tsx`
- `components/settings/NiSettingsSection.tsx`

Added `enabled` field to TaxRules and NiRules interfaces. Updated computePay method to check enabled flags before applying deductions. Updated settings sections to properly set enabled field. ✅

## ✅ 10. Rename "Worked" to "Standard" in Pay Calculator Hours Section (COMPLETED)

**Files:**

- `components/pay-calculator/PayHoursInput.tsx`

Updated label from "Worked" to "Standard" in hours input section. ✅

### To-dos

- [x] Verify default week start day is Monday in settingsService.ts
- [x] Add note support in Manual Mode (ManualModeInput.tsx, shiftService.ts)
- [x] Fix Timer Mode break time calculation in useTimer.ts
- [x] Implement Edit functionality for Tracker History (EditSubmissionModal.tsx)
- [x] Implement Duplicate functionality for Tracker History (DuplicateSubmissionModal.tsx)
- [x] Remove Premium pay rate type across codebase
- [x] Refactor terminology: Base → Standard in UI (keep 'base' in code)
- [x] Add warnings and rate breakdown display in Pay Calculator Tracker Mode
- [x] Fix Tax and NI deduction toggle bug in settingsService.ts
- [x] Rename 'Worked' to 'Standard' in PayHoursInput.tsx
