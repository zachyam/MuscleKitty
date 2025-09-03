import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useUser } from '@/utils/context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FancyAlert from '@/components/FancyAlert';
import { 
  OnboardingService, 
  KITTY_IMAGES, 
  KITTY_GIFS, 
  KITTY_ID_TO_BREED 
} from '@/app/service/onboarding/OnboardingService';

// Re-export for backward compatibility
export { KITTY_IMAGES, KITTY_GIFS, KITTY_ID_TO_BREED };

export default function NameKittyScreen() {
  const [kittyId, setKittyId] = useState('');
  const [kittyName, setKittyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { user, completeOnboarding } = useUser();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const getSelectedKitty = async () => {
      if (user?.id) {
        const storedKittyId = await OnboardingService.getSelectedKitty(user.id);
        
        if (storedKittyId) {
          setKittyId(storedKittyId);
        } else {
          console.log('No kitty selected, redirecting to adoption screen');
          setTimeout(() => {
            router.push('/(auth)/onboarding/adopt-kitty');
          }, 50);
        }
      }
    };

    // Simple fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    getSelectedKitty();
  }, [user?.id]);

  // Validate kitty name when it changes
  useEffect(() => {
    setIsValid(OnboardingService.validateKittyName(kittyName));
  }, [kittyName]);
  
  // Add keyboard show/hide listeners to apply faster animation
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext({
          duration: 150, // Faster animation (default is around 300ms)
          create: {
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
          },
          update: {
            type: LayoutAnimation.Types.easeInEaseOut,
          },
        });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext({
          duration: 150, // Faster animation
          create: {
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
          },
          update: {
            type: LayoutAnimation.Types.easeInEaseOut,
          },
        });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Handle name confirmation
  const handleConfirmName = async () => {
    if (!OnboardingService.validateKittyName(kittyName)) return;
    
    try {
      setIsSubmitting(true);
      
      if (user?.id && user?.email) {
        // Complete kitty naming using the service
        const result = await OnboardingService.completeKittyNaming(
          user.id,
          user.email,
          user.fullName || "Unknown Kitty",
          kittyName,
          kittyId
        );
        
        if (!result.success) {
          setShowAlert(true);
          setAlertMessage(result.error || "Error! There was a problem saving your kitty's name. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }
      
      // We've already stored the kitty ID in the adopt-kitty page
      // Now we're adding the name and completing the onboarding flow
      await completeOnboarding(kittyId);
      console.log('Onboarding completed successfully with kitty:', kittyId, 'and name:', kittyName);
      
      // Create a separate component for the transition
      // Keep the "Confirming..." spinner visible for a while to simulate a splash screen
      setTimeout(() => {
        // First navigate to splash screen for a smooth transition
        router.replace('/(main)/(tabs)');
      }, 1500);
    } catch (error) {
      console.error('Error saving kitty name:', error);
      setShowAlert(true);
      setAlertMessage("Error! There was a problem saving your kitty's name. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {showAlert && (
        <FancyAlert
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.dismissKeyboard}
            onPress={Keyboard.dismiss}
          >
            {/* Top Content */}
            <View style={styles.topContent}>
              <View style={styles.titleCard}>
                <Text style={styles.title}>What's my name?</Text>
              </View>
              
              <View style={styles.kittyContainer}>
                {kittyId && KITTY_IMAGES[kittyId] && (
                  <Image 
                    source={KITTY_IMAGES[kittyId]} 
                    style={styles.kittyImage} 
                    resizeMode="contain" 
                  />
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Name your kitty"
                  placeholderTextColor="#999"
                  value={kittyName}
                  onChangeText={setKittyName}
                  maxLength={20}
                  autoFocus
                />
              </View>
            </View>
            
            {/* Bottom Button - Always above keyboard */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.confirmButton,
                  !isValid && styles.disabledButton,
                  isSubmitting && styles.submittingButton
                ]}
                onPress={handleConfirmName}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dismissKeyboard: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    padding: 20,
  },
  topContent: {
    alignItems: 'center',
    width: '100%',
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  title: {  
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  kittyContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  kittyImage: {
    width: 120,
    height: 120,
  },
  inputContainer: {
    width: '100%',
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    height: 60,
    fontSize: 18,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    color: '#333333',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto', // Push button to bottom
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0.1,
  },
  submittingButton: {
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
});