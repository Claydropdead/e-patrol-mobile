# PNP E-Patrol Mobile App

A React Native Expo mobile application for Philippine National Police personnel to manage beat assignments and location tracking.

## Features

- **Personnel Login**: Secure authentication for police personnel
- **Beat Details**: View assigned patrol beat information
- **Beat Acceptance**: Accept beat assignments for duty shifts
- **Location Tracking**: Real-time GPS tracking during patrol duty
- **Status Management**: Update duty status (On Duty, Break, Off Duty)

## Prerequisites

- Node.js (v18 or later)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator / Android Emulator or physical device
- Expo Go app (for testing on physical device)

## Installation

1. **Clone and setup the project:**
   ```bash
   cd e-patrol-mobile
   npm install
   ```

2. **Configure environment variables:**
   
   Update `.env` file with your backend configuration:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xgsffeuluxsmgrhnrusl.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   EXPO_PUBLIC_API_BASE_URL=http://your-backend-url:3000
   ```

   Also update `app.json` extra section with the same values.

3. **Required Backend APIs:**
   
   Ensure your backend has these endpoints running:
   - `POST /api/auth/mobile-login` - Personnel authentication
   - `GET /api/personnel/beat/:id` - Get assigned beat
   - `POST /api/personnel/beat/accept` - Accept beat assignment
   - `POST /api/personnel/status` - Update duty status
   - `POST /api/personnel/locations` - Send location updates

## Running the App

### Development Mode

```bash
# Start the development server
npm start

# Run on specific platform
npm run android    # Android emulator/device
npm run ios        # iOS simulator (macOS only)
npm run web        # Web browser
```

### Using Expo Go

1. Install Expo Go on your mobile device
2. Scan the QR code from the terminal
3. The app will load on your device

## App Flow

1. **Login Screen**: Personnel enter email and password
2. **Beat Details Screen**: View assigned beat and accept assignment
3. **Location Tracking Screen**: Start duty and track location in real-time

## Key Components

### Services
- `src/services/auth.ts` - Authentication management
- `src/services/location.ts` - GPS tracking and location updates
- `src/services/beat.ts` - Beat management and status updates
- `src/services/supabase.ts` - Database connection

### Screens
- `src/screens/LoginScreen.tsx` - User authentication
- `src/screens/BeatDetailsScreen.tsx` - Beat information and acceptance
- `src/screens/LocationTrackingScreen.tsx` - Real-time location tracking

### Types
- `src/types/database.ts` - TypeScript interfaces for data models

## Permissions

The app requires the following permissions:
- **Location Access**: For GPS tracking during patrol duty
- **Background Location**: To continue tracking when app is minimized

## Testing

### Test Personnel Login
Use any personnel account created through the web application:
- Email: personnel email
- Password: personnel password

### Test Flow
1. Login with personnel credentials
2. View and accept beat assignment
3. Start duty to begin location tracking
4. Test status changes (Break, Resume, End Duty)

## Deployment

### Building for Production

```bash
# Build for Android
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

### Configuration for Production

1. Update environment variables for production backend
2. Configure proper app signing certificates
3. Set up push notification credentials (if needed)
4. Test on physical devices before release

## Troubleshooting

### Common Issues

1. **Location Permission Denied**
   - Ensure location permissions are granted in device settings
   - Check if background location is enabled

2. **API Connection Failed**
   - Verify backend server is running
   - Check API_BASE_URL in environment variables
   - Ensure mobile device can reach the backend server

3. **Login Failed**
   - Verify personnel account exists in backend
   - Check mobile login API endpoint is working
   - Confirm credentials are correct

### Development Tips

- Use `npm start -- --clear` to clear Metro cache
- Check Expo DevTools for detailed error logs
- Use physical device for accurate location testing
- Test with actual personnel accounts from your backend

## Backend Integration

This mobile app is designed to work with the E-Patrol backend system. Ensure the following APIs are implemented:

- Personnel authentication via `/api/auth/mobile-login`
- Beat assignment management
- Location data collection
- Status tracking for duty management

## Security Notes

- All API communications should use HTTPS in production
- Location data is only transmitted when personnel are on duty
- User credentials are stored securely using Expo SecureStore
- Background location access is restricted to duty hours only
