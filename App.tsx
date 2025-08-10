import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { authService } from './src/services/auth'
import { LoginScreen } from './src/screens/LoginScreen'
import { BeatDetailsScreen } from './src/screens/BeatDetailsScreen'
import { LocationTrackingScreen } from './src/screens/LocationTrackingScreen'

type RootStackParamList = {
  Login: undefined
  BeatDetails: undefined
  LocationTracking: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [beatAccepted, setBeatAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const loggedIn = await authService.isLoggedIn()
      setIsLoggedIn(loggedIn)
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
  }

  const handleBeatAccepted = () => {
    setBeatAccepted(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setBeatAccepted(false)
  }

  if (isLoading) {
    return null // You could add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
          </Stack.Screen>
        ) : !beatAccepted ? (
          <Stack.Screen name="BeatDetails">
            {() => <BeatDetailsScreen onBeatAccepted={handleBeatAccepted} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="LocationTracking">
            {() => <LocationTrackingScreen onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
