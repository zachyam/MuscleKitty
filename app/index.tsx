import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { isAuthenticated } from '@/utils/auth';
import { View, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';

export default function Index() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null);

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

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}