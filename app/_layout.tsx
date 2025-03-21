import React, { useEffect, useState } from 'react';
import { Stack, Redirect, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isAuthenticated } from '@/utils/auth';
import { View, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { UserProvider, useUser } from '@/utils/UserContext';
import SplashScreen from '@/components/SplashScreen';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

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
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
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
    
    const inTabsGroup = segments[0] === "(tabs)";
    const onboardingScreens = ['onboarding', 'adopt-kitty', 'name-kitty'];
    const authScreens = ['login', 'signup'];
    const protectedPaths = [...authScreens, ...onboardingScreens];
    const currentPath = segments[0];
    
    // Handle login->onboarding transition with proper splash
    // Use a longer timeout for the first-time login case to ensure a smooth transition
    if (user && isFirstLogin && !onboardingScreens.includes(currentPath)) {
      console.log('First-time user detected, showing splash screen transition to onboarding');
      
      // Give time for a splash-like effect before navigating to onboarding
      // This delay ensures a smooth loading experience between login/signup and onboarding
      setTimeout(() => {
        console.log('Transitioning to onboarding after delay');
        router.replace('/onboarding');
      }, 1500);
      
      return;
    }
    
    // Wait for mounting to complete before other navigation cases
    const navigateAfterMounting = setTimeout(() => {
      // If not logged in, only allow access to auth screens
      if (!user) {
        if (!authScreens.includes(currentPath) && currentPath !== 'login') {
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
    }, 200); // Short delay to ensure mounting completes for normal cases
    
    return () => clearTimeout(navigateAfterMounting);
  }, [user, loading, isFirstLogin, segments, router]);

  if (isLoading || loading) {
    // Determine where the user should be directed after loading
    let navigateTo = '/login';
    
    if (user) {
      navigateTo = isFirstLogin ? '/onboarding' : '/(tabs)';
    }
    
    // During initial layout loading, just show the splash screen appearance
    // without auto-navigation, as that will be handled by the effect above
    return <SplashScreen navigateTo={navigateTo} />;
  }

  return <>{children}</>;
}