import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';

// Static component just renders the splash screen UI without navigation
export const StaticSplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://cdn.dribbble.com/userupload/9328318/file/original-372a31363e584305d2763f4f50becddd.jpg' }}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

interface SplashScreenProps {
  navigateTo: string;
  autoNavigate?: boolean;
}

const SplashScreen = ({ navigateTo, autoNavigate = true }: SplashScreenProps) => {
  useEffect(() => {
    if (!autoNavigate) return;
    
    // Ensure splash screen shows for full 1.5 seconds
    console.log(`SplashScreen: Will navigate to ${navigateTo} after 1500ms`);
    
    const timer = setTimeout(() => {
      console.log(`SplashScreen: Navigating to ${navigateTo} now`);
      if (navigateTo.startsWith('/')) {
        // For absolute paths
        router.replace(navigateTo);
      } else {
        // For relative paths
        router.replace(navigateTo);
      }
    }, 1000);

    return () => {
      console.log('SplashScreen: cleanup');
      clearTimeout(timer);
    };
  }, [navigateTo, autoNavigate]);

  return <StaticSplashScreen />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  image: {
    width: '70%',
    height: '70%',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default SplashScreen;