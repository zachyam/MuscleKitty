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
              contentStyle: { backgroundColor: Colors.background },
              animation: 'fade',
              animationDuration: 200,
            }}
          >
            <Stack.Screen name="adopt-kitty" options={{ animation: 'fade' }} />
            <Stack.Screen name="name-kitty" options={{ animation: 'fade' }} />
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
    
    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const onboardingScreens = ['onboarding', 'adopt-kitty', 'name-kitty'];
    const protectedPaths = ['login', 'signup', 'onboarding', 'adopt-kitty', 'name-kitty'];
    const currentPath = segments[0];
    
    // Handle navigation immediately for first-time users (no delay) to prevent flash
    if (user && isFirstLogin && !onboardingScreens.includes(currentPath)) {
      console.log('Immediate redirect: New user needs onboarding');
      router.replace('/onboarding');
      return;
    }
    
    // Wait for mounting to complete before other navigation cases
    const navigateAfterMounting = setTimeout(() => {
      // If not logged in, only allow access to auth group
      if (!user) {
        if (!inAuthGroup) {
          console.log('Not logged in, redirecting to login');
          router.replace('/login');
        }
        return;
      }
      
      // User is logged in at this point
      
      // First-time login users should go through onboarding flow
      if (isFirstLogin) {
        // Only redirect if not already in the right place
        if (!onboardingScreens.includes(currentPath)) {
          console.log('First login detected, redirecting to onboarding');
          router.replace('/onboarding');
        }
        return;
      }
      
      // Returning users should always have access to app routes after onboarding
      // Only redirect if they're on login/signup/onboarding screens
      if (currentPath && protectedPaths.includes(currentPath)) {
        console.log('User already onboarded, redirecting to main app');
        router.replace('/(tabs)');
      }
    }, 100); // Short delay to ensure mounting completes for normal cases
    
    return () => clearTimeout(navigateAfterMounting);
  }, [user, loading, isFirstLogin, segments, router]);

  if (isLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}