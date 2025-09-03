import React, { useEffect } from 'react';
import { isAuthenticated } from '@/app/(auth)/auth';
import SplashScreen, { StaticSplashScreen } from '@/components/SplashScreen';
import { useLocalSearchParams } from 'expo-router';

export default function Index() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null);
  const { showSplash } = useLocalSearchParams<{ showSplash?: string }>();
  
  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      try {
        console.log('Checking authentication in index.tsx');
        const authenticated = await isAuthenticated();
        console.log('Authentication result:', authenticated);
        setIsLoggedIn(authenticated);
      } catch (error) {
        console.error('Failed to check authentication:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);
  
  // Show static splash while loading, then navigate when done
  if (isLoading) {
    return <StaticSplashScreen />;
  }
  
  // After loading completes, use SplashScreen to navigate to the appropriate route
  if (isLoggedIn) {
    return <SplashScreen navigateTo={'/(tabs)'} />;
  }
}