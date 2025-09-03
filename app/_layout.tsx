import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isAuthenticated } from '@/app/(auth)/auth';
import Colors from '@/constants/Colors';
import { UserProvider, useUser } from '@/utils/context/UserContext';
import SplashScreen from '@/components/SplashScreen';
import * as Splash from 'expo-splash-screen';

Splash.hide();

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
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
              <Stack.Screen name="workout" options={{ animation: 'fade' }} />
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
    
    const authScreens = ['(auth)'];
    const protectedPaths = [...authScreens];
    const currentPath = segments[0];
    
    // Handle login->onboarding transition with proper splash
    // Use a longer timeout for the first-time login case to ensure a smooth transition
    if (user && isFirstLogin) {
      console.log('First-time user detected, showing splash screen transition to onboarding');
      
      // Stop here for any screen if user is in first-login state
      // This prevents flashing of tabs content for new users
      if (currentPath !== '(auth)') {
        console.log('First-time user on non-onboarding screen, redirecting immediately');
        setTimeout(() => {
          // First navigate to splash screen for a smooth transition
          router.replace('/(auth)/onboarding');
        }, 1500);
      }
      return;
    }
    
    // If not logged in, only allow access to auth screens
    if (!user) {
      if (!authScreens.includes(currentPath)) {
        console.log('Not logged in, redirecting to login');
        router.replace('/(auth)/login');
      }
      return;
    }
    
    // User is logged in at this point and has completed onboarding
    
    // Returning users should always have access to app routes after onboarding
    // Only redirect if they're on auth screens
    if (currentPath && protectedPaths.includes(currentPath)) {
      console.log('User already onboarded, redirecting to main app');
      setTimeout(() => {
        // First navigate to splash screen for a smooth transition
        router.replace('/(main)/(tabs)');
      }, 1500);
    }
  }, [user, loading, isFirstLogin, segments, router]);

  if (isLoading || loading) {
    // Determine where the user should be directed after loading
    let navigateTo = '/(auth)/login';
    
    if (user) {
      // Force onboarding for first-time users to prevent any flash of tabs content
      navigateTo = isFirstLogin ? '/(auth)/onboarding' : '/(main)/(tabs)';
    }
    
    // During initial layout loading, show static splash screen without auto-navigation
    // Auto-navigation is handled by the useEffect above once loading is complete
    return <SplashScreen autoNavigate={false} navigateTo={navigateTo} />;
  }

  return <>{children}</>;
}
