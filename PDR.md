# ShiftPal - Product Requirements Document (PRD)

## Executive Summary

**Product Name:** ShiftPal  
**Version:** 1.0.0  
**Platform:** iOS/Android (React Native with Expo)  
**Target Market:** Shift workers, hourly employees, freelancers, and contractors  
**Primary Goal:** Simplify shift tracking and pay calculation for hourly workers

ShiftPal is a comprehensive shift tracking and pay calculation app designed to help hourly workers accurately track their work hours, calculate pay with complex rules (overtime, night shifts, weekends), and maintain detailed work history. The app combines intuitive time tracking with sophisticated pay calculation capabilities.

---

## Product Overview

### Vision Statement
To empower shift workers with accurate, transparent, and easy-to-use tools for tracking their work hours and understanding their pay calculations.

### Core Value Proposition
- **Accurate Time Tracking**: Built-in timer with break management and manual entry options
- **Intelligent Pay Calculation**: Handles complex pay rules including overtime, night shifts, weekend premiums
- **Comprehensive History**: Detailed records of all shifts and pay calculations
- **Flexible Configuration**: Customizable pay rates, rules, and preferences

---

## Target Users

### Primary Users
1. **Shift Workers** - Retail, hospitality, healthcare workers with varying schedules
2. **Hourly Employees** - Part-time workers needing to track multiple jobs
3. **Contractors/Freelancers** - Independent workers billing by the hour
4. **Students** - Part-time workers with complex scheduling needs

### User Personas
- **Sarah, Retail Manager**: Works varying shifts, needs overtime tracking, manages multiple pay rates
- **Mike, Healthcare Worker**: Night shifts, weekend premiums, break tracking essential
- **Emma, Freelancer**: Multiple clients, different rates, detailed pay history for invoicing

---

## Core Features & Functionality

### 1. Authentication & User Management
**Current Implementation:**
- Firebase email/password authentication
- Secure user registration and login
- Protected routes with persistent sessions
- Account management and sign-out functionality

**User Stories:**
- As a user, I want to create an account so I can securely store my shift data
- As a user, I want to log in to access my data across devices
- As a user, I want my data to be private and secure

### 2. Shift Tracking System

#### 2.1 Timer-Based Tracking
**Current Implementation:**
- Real-time shift timer with start/stop functionality
- Break management with pause/resume capability
- Break notes and duration tracking
- Automatic shift creation from timer sessions

**Features:**
- Start/stop timer for active shifts
- Pause timer for breaks with optional notes
- Undo last break functionality
- Include/exclude breaks from total time
- Visual timer status indicators

**User Stories:**
- As a shift worker, I want to start a timer when I begin work
- As a user, I want to pause the timer during breaks
- As a user, I want to add notes to my breaks for record-keeping
- As a user, I want to choose whether breaks count toward my total hours

#### 2.2 Manual Shift Entry
**Current Implementation:**
- Manual time entry with start/end time pickers
- Duration calculation and validation
- Flexible date selection for backdated entries

**Features:**
- Manual start/end time entry
- Date picker for any date
- Automatic duration calculation
- Time validation and error handling

**User Stories:**
- As a user, I want to manually enter shifts I forgot to track
- As a user, I want to add shifts for previous dates
- As a user, I want the app to calculate duration automatically

#### 2.3 Shift Management
**Current Implementation:**
- View all shifts for selected dates
- Edit and delete individual shifts
- Daily totals calculation
- Shift submission system

**Features:**
- Daily shift overview with totals
- Individual shift editing/deletion
- Bulk shift operations
- Shift validation and error checking

### 3. Pay Calculation Engine

#### 3.1 Pay Rate Management
**Current Implementation:**
- Multiple pay rate storage (base, overtime, premium)
- Rate labeling and categorization
- CRUD operations for pay rates
- Rate selection for calculations

**Features:**
- Unlimited custom pay rates
- Rate categorization (base/overtime/premium)
- Rate history and versioning
- Quick rate selection

**User Stories:**
- As a user, I want to store multiple pay rates for different jobs
- As a user, I want to label my rates for easy identification
- As a user, I want to quickly select rates when calculating pay

#### 3.2 Advanced Pay Rules

##### Overtime Rules
**Current Implementation:**
- Daily and weekly overtime thresholds
- Multiplier and fixed uplift options
- Automatic overtime calculation
- Flexible overtime basis selection

**Features:**
- Daily overtime (e.g., >8 hours = 1.5x rate)
- Weekly overtime (e.g., >40 hours = 2x rate)
- Multiple overtime tiers
- Custom overtime rates vs. multipliers

##### Night Shift Premiums
**Current Implementation:**
- Configurable night shift hours (e.g., 22:00-06:00)
- Percentage or fixed rate premiums
- Automatic night hour detection
- Night shift enable/disable toggle

**Features:**
- Custom night shift time windows
- Percentage or fixed premiums
- Automatic night hour allocation
- Night shift rule management

##### Weekend Premiums
**Current Implementation:**
- Configurable weekend days
- Multiplier or fixed uplift options
- Weekend day selection (Sat/Sun customizable)
- Stacking vs. highest-only rule application

**Features:**
- Custom weekend day selection
- Multiple premium calculation methods
- Rule stacking configuration
- Weekend premium management

#### 3.3 Tax and Deductions
**Current Implementation:**
- Basic tax percentage calculation
- National Insurance (NI) calculations
- Personal allowance support
- Gross to net pay conversion

**Features:**
- Configurable tax rates
- Personal allowance deductions
- NI threshold and rate settings
- Automatic deduction calculations

### 4. Pay Calculator

#### 4.1 Tracker Mode
**Current Implementation:**
- Automatic hour derivation from submitted shifts
- Intelligent overtime splitting
- Night shift hour allocation
- Real-time pay calculation

**Features:**
- Automatic data population from shift tracker
- Smart overtime detection and splitting
- Night shift hour calculation
- Live pay breakdown updates

#### 4.2 Manual Mode
**Current Implementation:**
- Manual hour and rate entry
- Custom pay rate input
- Flexible calculation parameters
- Override capabilities for complex scenarios

**Features:**
- Full manual control over all parameters
- Custom rate entry when no saved rates exist
- Flexible hour allocation (base/overtime/night)
- Advanced calculation overrides

#### 4.3 Pay History & Analytics
**Current Implementation:**
- Detailed pay calculation history
- Period filtering (week/month/all)
- Pay breakdown visualization
- Settings version tracking for recalculation

**Features:**
- Comprehensive calculation history
- Period-based filtering and summaries
- Detailed pay breakdowns
- Recalculation when settings change
- Export capabilities

### 5. Settings & Configuration

#### 5.1 Pay Configuration
**Current Implementation:**
- Pay rate management interface
- Pay rule configuration (overtime, night, weekend)
- Tax and deduction settings
- Rule enable/disable toggles

**Features:**
- Intuitive pay rate management
- Visual pay rule configuration
- Tax and deduction setup
- Rule validation and testing

#### 5.2 Preferences
**Current Implementation:**
- Currency selection (GBP/USD/EUR)
- Time format (12h/24h)
- Date format preferences
- Week start day configuration
- Goal setting (weekly/monthly targets)

**Features:**
- Multi-currency support
- Localization preferences
- Goal tracking and progress
- Customizable week start days

#### 5.3 Advanced Settings
**Current Implementation:**
- Rule stacking configuration
- Rounding rule settings
- Theme management (light/dark/system)
- Account management

**Features:**
- Advanced calculation rules
- Precision and rounding controls
- Appearance customization
- Data management tools

### 6. Data Management

#### 6.1 Local Storage
**Current Implementation:**
- AsyncStorage for offline functionality
- Local-first architecture
- Immediate data availability
- Offline capability

#### 6.2 Cloud Sync
**Current Implementation:**
- Firebase Firestore integration
- Automatic background sync
- Cross-device data synchronization
- Conflict resolution

#### 6.3 Data Export/Import
**Current Status:** Not implemented
**Planned Features:**
- CSV export for pay history
- Shift data export
- Backup and restore functionality
- Data portability

---

## Technical Architecture

### Frontend
- **Framework:** React Native with Expo
- **Navigation:** Expo Router (file-based routing)
- **State Management:** React hooks and context
- **UI Components:** Custom themed components
- **Styling:** StyleSheet with dynamic theming

### Backend Services
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Local Storage:** AsyncStorage
- **Analytics:** Firebase Analytics (basic implementation)

### Key Dependencies
- `expo-router` - Navigation and routing
- `firebase` - Backend services
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-toast-message` - User notifications
- `expo-linear-gradient` - UI enhancements
- `@react-native-picker/picker` - Native picker components

---

## User Experience Flow

### 1. Onboarding Flow
1. **Welcome Screen** → App introduction and value proposition
2. **Registration** → Account creation with email/password
3. **Initial Setup** → Basic pay rate and preferences configuration
4. **Tutorial** → Guided tour of key features

### 2. Daily Usage Flow
1. **Home Screen** → Quick access to timer and shift overview
2. **Start Shift** → Timer activation with break management
3. **End Shift** → Shift completion and submission
4. **Pay Calculation** → Automatic or manual pay calculation
5. **History Review** → View past shifts and pay calculations

### 3. Configuration Flow
1. **Settings Access** → Navigate to settings from any screen
2. **Pay Setup** → Configure rates, rules, and preferences
3. **Rule Testing** → Validate configuration with sample calculations
4. **Ongoing Management** → Regular updates and adjustments

---

## Success Metrics

### User Engagement
- Daily active users (DAU)
- Session duration and frequency
- Feature adoption rates
- User retention (1-day, 7-day, 30-day)

### Functionality Metrics
- Shift tracking accuracy
- Pay calculation usage
- Settings configuration completion
- Data sync success rates

### Business Metrics
- User acquisition and growth
- App store ratings and reviews
- Support ticket volume and resolution
- Feature request frequency and themes

---

## Competitive Analysis

### Direct Competitors
1. **HoursTracker** - Simple time tracking with basic pay calculation
2. **Clockify** - Team-focused with individual tracking capabilities
3. **RescueTime** - Automatic tracking with productivity focus

### Competitive Advantages
- **Specialized for Shift Workers** - Purpose-built for hourly/shift work scenarios
- **Advanced Pay Rules** - Sophisticated overtime, night, and weekend calculations
- **Offline-First** - Works without internet connection
- **Transparent Calculations** - Detailed pay breakdowns and rule explanations

### Differentiation Strategy
- Focus on complex pay rule scenarios common in shift work
- Intuitive mobile-first design optimized for quick interactions
- Comprehensive but accessible pay calculation engine
- Strong offline capabilities for workers in low-connectivity environments

---

## Roadmap & Future Enhancements

### Phase 1 (Current) - Core Functionality
- ✅ Basic shift tracking and timer
- ✅ Pay calculation engine
- ✅ Settings and configuration
- ✅ Local storage and Firebase sync

### Phase 2 - Enhanced User Experience
- 🔄 Improved onboarding and tutorials
- 🔄 Advanced data export/import
- 🔄 Enhanced analytics and reporting
- 🔄 Push notifications and reminders

### Phase 3 - Advanced Features
- 📋 Multi-job/employer support
- 📋 Team collaboration features
- 📋 Integration with payroll systems
- 📋 Advanced reporting and insights

### Phase 4 - Platform Expansion
- 📋 Web application
- 📋 Desktop applications
- 📋 API for third-party integrations
- 📋 Enterprise features

---

## Risk Assessment

### Technical Risks
- **Firebase Dependency** - Mitigation: Local-first architecture with offline capability
- **Platform Updates** - Mitigation: Regular dependency updates and testing
- **Data Loss** - Mitigation: Multiple backup strategies and sync mechanisms

### Business Risks
- **Market Competition** - Mitigation: Focus on unique value proposition and user experience
- **User Adoption** - Mitigation: Strong onboarding and clear value demonstration
- **Monetization** - Mitigation: Freemium model with premium features

### Compliance Risks
- **Data Privacy** - Mitigation: GDPR compliance, clear privacy policy, minimal data collection
- **App Store Policies** - Mitigation: Regular policy review and compliance monitoring
- **Financial Calculations** - Mitigation: Transparent calculations, user education, disclaimers

---

## Conclusion

ShiftPal represents a comprehensive solution for shift workers who need accurate time tracking and pay calculation capabilities. The app's strength lies in its sophisticated pay rule engine combined with an intuitive user interface designed for mobile-first usage.

The current implementation provides a solid foundation with core functionality complete and operational. The focus should now shift to user experience refinement, comprehensive testing, and preparation for app store submission.

Key success factors include:
1. **Reliability** - Accurate calculations and dependable data storage
2. **Usability** - Intuitive interface that works well under real-world conditions
3. **Flexibility** - Adaptable to various shift work scenarios and pay structures
4. **Trust** - Transparent calculations and secure data handling

With proper execution of the remaining development tasks and a strong go-to-market strategy, ShiftPal has the potential to become an essential tool for the shift worker community.

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Next Review: Q1 2025*