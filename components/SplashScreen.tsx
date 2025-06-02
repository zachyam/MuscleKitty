import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';

// Static component just renders the splash screen UI without navigation
export const StaticSplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image 
        // source={{ uri: 'https://cdn.dribbble.com/userupload/9328318/file/original-372a31363e584305d2763f4f50becddd.jpg' }}
        source={require('@/assets/images/logo.png')}
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
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!autoNavigate) return;
    
    // Ensure splash screen shows for full 2.5 seconds
    console.log(`SplashScreen: Will navigate to ${navigateTo} after 2500ms`);
    
    const timer = setTimeout(() => {
      console.log(`SplashScreen: Navigating to ${navigateTo} now`);
      // Fade out before navigation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (navigateTo.startsWith('/')) {
          // For absolute paths
          router.replace(navigateTo);
        } else {
          // For relative paths
          router.replace(navigateTo);
        }
      });
    }, 1500);

    return () => {
      console.log('SplashScreen: cleanup');
      clearTimeout(timer);
    };
  }, [navigateTo, autoNavigate, fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image 
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  image: {
    width: '60%',
    height: '60%',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7E866F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    padding: 10,
    backgroundColor: '#EFF3EB'
  },
});

export default SplashScreen;