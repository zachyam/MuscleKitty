import React, { useEffect, useState } from 'react';
import { Stack, Redirect, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isAuthenticated } from '@/utils/auth';
import { View, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { UserProvider, useUser } from '@/utils/UserContext';
import SplashScreen from '@/components/SplashScreen';
import * as Splash from 'expo-splash-screen';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { setupConsoleToPosthog } from '@/utils/consoleToPosthog';

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
      <PostHogProvider
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY}
        options={{
          host: 'https://us.i.posthog.com',
          enableSessionReplay: true,
        }}
        autocapture
      >
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
      </PostHogProvider>
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
  const posthog = usePostHog();

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
  
  useEffect(() => {
    // Set up PostHog console log forwarding when user is available
    if (posthog) {
      setupConsoleToPosthog(posthog, user?.id);
    }
  }, [posthog, user?.id]);
  
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
    if (user && isFirstLogin) {
      console.log('First-time user detected, showing splash screen transition to onboarding');
      
      // Stop here for any screen if user is in first-login state
      // This prevents flashing of tabs content for new users
      if (!onboardingScreens.includes(currentPath)) {
        console.log('First-time user on non-onboarding screen, redirecting immediately');
        setTimeout(() => {
          // First navigate to splash screen for a smooth transition
          router.replace('/onboarding');
        }, 1500);
      }
      return;
    }
    
    // If not logged in, only allow access to auth screens
    if (!user) {
      if (!authScreens.includes(currentPath) && currentPath !== 'login') {
        console.log('Not logged in, redirecting to login');
        router.replace('/login');
      }
      return;
    }
    
    // User is logged in at this point and has completed onboarding
    
    // Returning users should always have access to app routes after onboarding
    // Only redirect if they're on login/signup/onboarding screens
    if (currentPath && protectedPaths.includes(currentPath)) {
      console.log('User already onboarded, redirecting to main app');
      setTimeout(() => {
        // First navigate to splash screen for a smooth transition
        router.replace('/(tabs)');
      }, 1500);
    }
  }, [user, loading, isFirstLogin, segments, router]);

  if (isLoading || loading) {
    // Determine where the user should be directed after loading
    let navigateTo = '/login';
    
    if (user) {
      // Force onboarding for first-time users to prevent any flash of tabs content
      navigateTo = isFirstLogin ? '/onboarding' : '/(tabs)';
    }
    
    // During initial layout loading, show static splash screen without auto-navigation
    // Auto-navigation is handled by the useEffect above once loading is complete
    return <SplashScreen autoNavigate={false} navigateTo={navigateTo} />;
  }

  return <>{children}</>;
}
