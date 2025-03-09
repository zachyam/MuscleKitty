import React, { useEffect, useState } from 'react';
import { Stack, Redirect, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from 'expo-router';
import { isAuthenticated } from '@/utils/auth';
import { View, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { UserProvider, useUser } from '@/utils/UserContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

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
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
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
  
  const { user, loading, isFirstLogin } = useUser();
  const router = useRouter();
  const segments = useSegments();

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
  
  // Effect for navigation logic
  useEffect(() => {
    if (loading) return;
    
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'onboarding';
    const inLoginGroup = segments[0] === 'login';
    
    console.log('Auth navigation check:', {
      user: !!user,
      isFirstLogin,
      currentPath: segments[0]
    });
    
    if (!user) {
      // If not logged in, redirect to login
      if (inAuthGroup) {
        console.log('Not logged in, redirecting to login');
        router.replace('/login');
      }
    } else {
      // If logged in
      if (isFirstLogin) {
        // First login - redirect to onboarding unless already there
        if (segments[0] !== 'onboarding') {
          console.log('First login detected, redirecting to onboarding');
          router.replace('/onboarding');
        }
      } else {
        // Not first login - redirect to main app unless already there
        if (!inAuthGroup || segments[0] === 'onboarding') {
          console.log('User already onboarded, redirecting to main app');
          router.replace('/(tabs)');
        }
      }
      
      // Always redirect away from login page if logged in
      if (inLoginGroup) {
        router.replace(isFirstLogin ? '/onboarding' : '/(tabs)');
      }
    }
  }, [user, loading, isFirstLogin, segments]);

  if (isLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}