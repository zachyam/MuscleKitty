import React, { useEffect, useState } from 'react';
import { Stack, Redirect, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from 'expo-router';
import { isAuthenticated } from '@/utils/auth';
import { View, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Import UserProvider
import { UserProvider } from '@/utils/UserContext';

// This is the root layout for the app
export default function RootLayout() {
  return (
    <>
      <UserProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: false, // Disable gesture navigation at stack level
              animation: 'none'  // Disable animations for cleaner transitions
            }}
          >
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                gestureEnabled: false // Explicitly disable gestures for tabs
              }} 
            />
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} redirect />
          </Stack>
        </AuthProvider>
      </UserProvider>
      <StatusBar style="auto" />
    </>
  );
}

// Auth provider component to handle authentication state
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication and hide splash screen
    const initialize = async () => {
      try {
        const authenticated = await isAuthenticated();
        setUserAuthenticated(authenticated);
        
        // Hide the splash screen
        setTimeout(() => {
          SplashScreen.hideAsync().catch(() => {});
          if (typeof window !== 'undefined') {
            window.frameworkReady?.();
          }
        }, 500);
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  console.log('Auth provider rendering, authenticated:', userAuthenticated);
  return <>{children}</>;
}