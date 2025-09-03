import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useUser } from '@/utils/context/UserContext';

// Define the content for each screen
const SCREENS = [
  {
    title: "Customize Your Training",
    subtitle: "Design your own workout routines, log them effortlessly, and track your progress.",
  },
  {
    title: "Adopt a kitty and train with it",
    subtitle: "Stay consistent, level up, and keep your kitty strong",
  },
  {
    title: "Compete & Level Up",
    subtitle: "Add friends, compete against them, and see who trains the most consistently!",
  }
];

const OnboardingScreen = () => {
  const [activeScreen, setActiveScreen] = useState(0);
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { width, height } = useWindowDimensions();
      
  
  // Reset animation when screen changes
  useEffect(() => {
    fadeAnim.setValue(1);
  }, [activeScreen]);
  
  // Handle the next button press during onboarding
  const handleNext = async () => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (activeScreen < SCREENS.length - 1) {
        setActiveScreen(activeScreen + 1);
      } else {
        // Last screen, navigate to adopt kitty screen
        try {
          console.log('Last onboarding screen completed, navigating to adopt-kitty');
          router.replace('/(auth)/onboarding/adopt-kitty');
          return;
        } catch (error) {
          console.error('Error navigating to adopt kitty:', error);
          // As fallback, complete onboarding here and go to tabs
          completeOnboarding('1'); // Default to the first kitty (Munchkin)
          router.replace('/(main)/(tabs)');
          return;
        }
      }
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Handle back button press during onboarding
  const handleBack = () => {
    if (activeScreen > 0) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setActiveScreen(activeScreen - 1);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };
  
  const currentScreen = SCREENS[activeScreen];
  const isLastScreen = activeScreen === SCREENS.length - 1;

  const renderScreen = (screen: typeof SCREENS[0], index: number) => {
    return (
      <Animated.View 
        style={[styles.screenContainer, { opacity: fadeAnim }]} 
        key={index}
      >
        {/* Mascot circle */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.welcomeMascotImage}
            resizeMode="contain"
          />
        </View>

        {/* Title and subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeTitle}>{screen.title}</Text>
          <Text style={styles.welcomeSubtitle}>{screen.subtitle}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.welcomeContainer}>
      <View style={styles.welcomeContent}>
        {/* Current screen content */}
        {renderScreen(currentScreen, activeScreen)}

        {/* Pagination indicators */}
        <View style={styles.paginationContainer}>
          {SCREENS.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.paginationDot, 
                index === activeScreen && styles.activeDot
              ]} 
            />
          ))}
        </View>

        {/* Action button at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{ isLastScreen ? "Get Started" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingBottom: 20,
    paddingTop: 20,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
  },
  mascotContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  welcomeMascotImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
    minHeight: 120, // Fixed minimum height to prevent movement
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 'auto',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.lightGray,
    margin: 5,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 12,
    height: 12,
  },
});

export default OnboardingScreen;