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
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import PrimaryButton from './PrimaryButton';
import { useUser } from '@/utils/UserContext';

// Define the content for each screen
const SCREENS = [
  {
    title: "Customize Your Training",
    subtitle: "Design your own workout routines, log them effortlessly, and track your progress.",
    image: require('@/assets/images/logo.png'),
  },
  {
    title: "Adopt a kitty and train with it",
    subtitle: "Stay consistent, level up, and keep your kitty strong",
    image: require('@/assets/images/logo.png'),
  },
  {
    title: "Compete & Level Up",
    subtitle: "Add friends, compete against them, and see who trains the most consistently!",
    image: require('@/assets/images/logo.png'),
  }
];

const OnboardingScreen = () => {
  // Add state to track if we're showing the welcome page or onboarding
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeScreen, setActiveScreen] = useState(0);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const fadeTextAnim = useRef(new Animated.Value(1)).current; // Text opacity
  const scrollViewRef = useRef(null);

  
  // Handle login button press
  const handleLogin = () => {
    router.push('/login');
  };
  
  // Handle terms and privacy links
  const handleTermsPress = () => {
    Linking.openURL('https://your-website.com/terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://your-website.com/privacy');
  };
  
  // Handle the next button press during onboarding
  const handleNext = async () => {
    // Fade out only the text
    Animated.timing(fadeTextAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      if (activeScreen < SCREENS.length - 1) {
        // Move to next screen with scroll
        const nextScreen = activeScreen + 1;
        setActiveScreen(nextScreen);
        
        // Scroll to the next screen
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: width * nextScreen, animated: true });
        }
      } else {
        // Last screen, navigate to adopt kitty screen
        try {
          // Important: We don't complete onboarding here!
          // The adopt-kitty screen will handle completing onboarding
          console.log('Last onboarding screen completed, navigating to adopt-kitty');
          
          // Start the fade out animation using the existing ref
          Animated.timing(screenFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            // Navigate after fade completes
            console.log('Navigating to adopt-kitty');
            // Use replace to avoid navigation history issues
            router.replace('/adopt-kitty');
          });
          
          return; // Don't fade back in if we're navigating away
        } catch (error) {
          console.error('Error navigating to adopt kitty:', error);
          // As fallback, complete onboarding here and go to tabs
          // Use a default kitty ID since we couldn't navigate to the kitty selection
          await completeOnboarding('1'); // Default to the first kitty (Munchkin)
          router.replace('/(tabs)');
          return; // Don't fade back in if we're navigating away
        }
      }
      
      // Fade in animation for the text of the next screen
      Animated.timing(fadeTextAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Handle back button press during onboarding
  const handleBack = () => {
    if (activeScreen > 0) {
      const prevScreen = activeScreen - 1;
      setActiveScreen(prevScreen);
      
      // Scroll to the previous screen
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: width * prevScreen, animated: true });
      }
    } else {
      // If we're on the first onboarding screen, go back to welcome
      setShowWelcome(true);
    }
  };
  
  const currentScreen = SCREENS[activeScreen];
  const isLastScreen = activeScreen === SCREENS.length - 1;

  // Add effect to animate fade-in when screen changes
  useEffect(() => {
    // Fade in text of new screen
    Animated.timing(fadeTextAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [activeScreen]);

  // Handle scroll end to update active screen
  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    if (newIndex !== activeScreen) {
      setActiveScreen(newIndex);
    }
  };

  const renderScreen = (screen, index) => {
    return (
      <View style={[styles.screenContainer, { width }]} key={index}>
        {/* Mascot circle */}
        <View style={styles.mascotContainer}>
          <Image
            // source={{ uri: 'https://cdn.dribbble.com/userupload/9328318/file/original-372a31363e584305d2763f4f50becddd.jpg' }}
            source={require('@/assets/images/logo.png')}
            style={styles.welcomeMascotImage}
            resizeMode="contain"
          />
        </View>

        {/* Title and subtitle (animated for fade effect) */}
        <Animated.View style={{ opacity: index === activeScreen ? fadeTextAnim : 0 }}>
          <Text style={styles.welcomeTitle}>{screen.title}</Text>
          <Text style={styles.welcomeSubtitle}>{screen.subtitle}</Text>
        </Animated.View>
      </View>
    );
  };

  // Create a ref for the full-screen fade animation
  const screenFadeAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ flex: 1, opacity: screenFadeAnim }}>
    <SafeAreaView style={styles.welcomeContainer}>
      <View style={styles.welcomeContent}>
        {/* Horizontal scroll view for screens */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {SCREENS.map(renderScreen)}
        </Animated.ScrollView>

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
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // Existing styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: Colors.text,
    fontSize: 16,
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    color: Colors.gray,
    fontSize: 16,
  },
  welcomeCard: {
    backgroundColor: Colors.card,
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  mascotImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  textSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomSection: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  nextButton: {
    borderRadius: 30,
  },
  
  // New styles for welcome screen
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
  scrollView: {
    flex: 1,
    width: '100%',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  mascotContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },
  welcomeMascotImage: {
    width: 150,
    height: 150,
    borderRadius: 65,
    padding: 18,
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
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 10,
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
  secondaryButton: {
    paddingVertical: 12,
    marginBottom: 40,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
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
  legalContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  legalText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legalLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});

export default OnboardingScreen;