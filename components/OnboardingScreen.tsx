import React, { useState } from 'react';
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
    welcomeMessage: "Let's get your fitness journey started!",
    title: "Meet your fitness bestie!",
    subtitle: "Muscle Kitty will support your fitness goals every step of the way! 🐱",
    image: require('@/assets/images/icon.png'), // Replace with actual mascot image
  },
  {
    welcomeMessage: "Build your perfect workout!",
    title: "Create Workout Plans",
    subtitle: "Design and customize your own workout routines with exercises that fit your goals.",
    image: require('@/assets/images/icon.png'), // Replace with actual image
  },
  {
    welcomeMessage: "Watch yourself grow stronger!",
    title: "Track Your Progress",
    subtitle: "Log your workouts, see your improvement over time, and stay motivated!",
    image: require('@/assets/images/icon.png'), // Replace with actual image
  }
];

const OnboardingScreen = () => {
  // Add state to track if we're showing the welcome page or onboarding
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeScreen, setActiveScreen] = useState(0);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { completeOnboarding } = useUser();

  
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
    setShowWelcome(false);
    if (activeScreen < SCREENS.length - 1) {
      setActiveScreen(activeScreen + 1);
    } else {
      // Last screen, complete onboarding and navigate to main app
      try {
        // Add a delay to ensure the animation completes
        setTimeout(async () => {
          await completeOnboarding();
          router.replace('/(tabs)');
        }, 200);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Still navigate even if there's an error
        router.replace('/(tabs)');
      }
    }
  };
  
  // Handle back button press during onboarding
  const handleBack = () => {
    if (activeScreen > 0) {
      setActiveScreen(activeScreen - 1);
    } else {
      // If we're on the first onboarding screen, go back to welcome
      setShowWelcome(true);
    }
  };
  
  const currentScreen = SCREENS[activeScreen];
  const isLastScreen = activeScreen === SCREENS.length - 1;

  return (
    <SafeAreaView style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          {/* Mascot circle */}
          <View style={styles.mascotContainer}>
            <Image
              source={require('@/assets/images/icon.png')} // Use your app icon
              style={styles.welcomeMascotImage}
              resizeMode="contain"
            />
          </View>

          {showWelcome && (
            <>
              <Text style={styles.welcomeTitle}>MuscleKitty</Text>
            </>
          )}
          {/* Title and subtitle */}
          <Text style={styles.welcomeTitle}>{currentScreen.title}</Text>
          <Text style={styles.welcomeSubtitle}>{showWelcome? currentScreen.welcomeMessage : currentScreen.subtitle}</Text>  

          {/* Action buttons */}
          <TouchableOpacity
            style={styles.primaryButton} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{showWelcome ? "Get Started" : "Next"}</Text>
          </TouchableOpacity>

          {showWelcome && <TouchableOpacity 
            onPress={handleLogin}
            style={styles.secondaryButton}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryButtonText}>I have an account</Text>
          </TouchableOpacity>
          }

          {/* Legal text */}
          {showWelcome && <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By signing up or logging in, you agree to the{' '}
            </Text>
            <View style={styles.legalLinksContainer}>
              <TouchableOpacity onPress={handleTermsPress}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalText}> and the </Text>
              <TouchableOpacity onPress={handlePrivacyPress}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalText}>.</Text>
            </View>
          </View>
          }
        </View>
      </SafeAreaView>
  )
}

  // Onboarding screens (your existing implementation)
//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header with back button */}
//       {!showWelcome && <View style={styles.header}>
//         <TouchableOpacity onPress={handleBack} style={styles.backButton}>
//           <Text style={styles.backButtonText}>← Back</Text>
//         </TouchableOpacity>
//       </View>
//       }
      
//       {/* Welcome Card */}
//       <View style={styles.welcomeCard}>
//         <Text style={styles.welcomeMessage}>{currentScreen.welcomeMessage}</Text>
//       </View>
      
//       {/* Mascot Image */}
//       <View style={styles.imageContainer}>
//         <Image 
//           source={currentScreen.image} 
//           style={styles.mascotImage}
//           resizeMode="contain"
//         />
//       </View>
      
//       {/* Text Section */}
//       <View style={styles.textSection}>
//         <Text style={styles.title}>{currentScreen.title}</Text>
//         <Text style={styles.subtitle}>{currentScreen.subtitle}</Text>
//       </View>
      
//       {/* Bottom Section: Button and Pagination */}
//       {!showWelcome && <View style={styles.bottomSection}>
//         <PrimaryButton 
//           label={isLastScreen ? "Get Started" : "Next"} 
//           onPress={handleNext}
//           style={styles.nextButton}
//         />
        
//         {/* Pagination Indicators */}
//         <View style={styles.paginationContainer}>
//           {SCREENS.map((_, index) => (
//             <View 
//               key={index} 
//               style={[
//                 styles.paginationDot, 
//                 index === activeScreen && styles.activeDot
//               ]} 
//             />
//           ))}
//         </View>
//       </View>
//       }
//     </SafeAreaView>
//   );
// };

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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
  
  // New styles for welcome screen
  welcomeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  mascotContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(143, 201, 58, 0.2)', // Light primary color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
  },
  welcomeMascotImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
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
    marginBottom: 60,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
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