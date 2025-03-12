import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  UIManager,
  LayoutAnimation
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useUser } from '@/utils/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';

// Kitty images mapping for avatar selection
const KITTY_IMAGES: Record<string, any> = {
  '1': require('@/assets/images/munchkin.png'),
  '2': require('@/assets/images/orange-tabby.png'),
  '3': require('@/assets/images/russian-blue.png'),
  '4': require('@/assets/images/calico.png'),
  '5': require('@/assets/images/maine-coon.png'),
};

const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';
const KITTY_NAME_KEY = 'muscle_kitty_name';

export default function NameKittyScreen() {
  const [kittyId, setKittyId] = useState('');
  const [kittyName, setKittyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { user, completeOnboarding } = useUser();



  useEffect(() => {
    const getSelectedKitty = async () => {
      try {
        if (user?.id) {
          const userKittyKey = `${SELECTED_KITTY_KEY}_${user.id}`;
          const storedKittyId = await AsyncStorage.getItem(userKittyKey);
          
          if (storedKittyId) {
            setKittyId(storedKittyId);
            console.log('Retrieved kitty ID:', storedKittyId);
          } else {
            // If no kitty is selected, go back to adoption screen
            console.log('No kitty selected, redirecting to adoption screen');
            setTimeout(() => {
              router.push('/adopt-kitty');
            }, 50);
          }
        }
      } catch (error) {
        console.error('Error getting selected kitty:', error);
      }
    };

    // Start with opacity 0 and fade in
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    getSelectedKitty();
  }, [user?.id]);

  // Validate kitty name when it changes
  useEffect(() => {
    setIsValid(kittyName.trim().length > 0);
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

  // Check if kitty name is unique
  // const isKittyNameUnique = async (name: string): Promise<boolean> => {
  //   try {
  //     // For a demo app, simply check AsyncStorage for existing kitty names
  //     // This will work for same-device users which is sufficient for this app
      
  //     const allKeys = await AsyncStorage.getAllKeys();
  //     const kittyNameKeys = allKeys.filter(key => key.startsWith('muscle_kitty_name_'));
      
  //     // Get all stored kitty names
  //     const kittyNameValues = await AsyncStorage.multiGet(kittyNameKeys);
      
  //     // Check if the name already exists (case insensitive)
  //     const lowerCaseName = name.toLowerCase().trim();
      
  //     // Skip the current user's kitty key if it exists
  //     const nameExists = kittyNameValues.some(([key, value]) => {
  //       // If this is the current user's key and we're updating, don't count it as a duplicate
  //       if (user?.id && key === `muscle_kitty_name_${user.id}`) {
  //         return false;
  //       }
  //       return value && value.toLowerCase().trim() === lowerCaseName;
  //     });
      
  //     // If we get here, the name is unique as far as we can tell
  //     return !nameExists;
  //   } catch (error) {
  //     console.error('Error checking kitty name uniqueness:', error);
  //     return true; // Assume unique on error to not block users
  //   }
  // };

  const stringHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // Handle name confirmation
  const handleConfirmName = async () => {
    if (!kittyName.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if name is unique
      // const isUnique = await isKittyNameUnique(kittyName.trim());
      
      // if (!isUnique) {
      //   Alert.alert(
      //     "Name Already Taken",
      //     "This kitty name is already taken. Please choose a different name.",
      //     [{ text: "OK" }]
      //   );
      //   setIsSubmitting(false);
      //   return;
      // }
      
      // Store the kitty name
      if (user?.id) {
        const userKittyNameKey = `${KITTY_NAME_KEY}_${user.id}`;
        await AsyncStorage.setItem(userKittyNameKey, kittyName.trim());

        const kittyHashKey = `${kittyName}_${user.id}`;
        const kittyNameHash = stringHash(userKittyNameKey);
        await AsyncStorage.setItem(kittyHashKey, kittyNameHash.toString());
        console.log("User Kitty Unique Hash key:", kittyHashKey);
        console.log("User Kitty Unique Hash:", kittyNameHash.toString());
        
        // Update user metadata in Supabase
        const { error } = await supabase.auth.updateUser({
          data: { kittyName: kittyName.trim() }
        });
        
        if (error) {
          console.error('Error updating user metadata:', error);
        }
      }
      
      // We've already stored the kitty ID in the adopt-kitty page
      // Now we're adding the name and completing the onboarding flow
      await completeOnboarding(kittyId);
      console.log('Onboarding completed successfully with kitty:', kittyId, 'and name:', kittyName);
      
      // Use setTimeout to ensure navigation happens after layout is fully mounted
      setTimeout(() => {
        // Navigate to main app with slide animation
        router.replace('/(tabs)');
      }, 50);
    } catch (error) {
      console.error('Error saving kitty name:', error);
      Alert.alert(
        "Error",
        "There was a problem saving your kitty's name. Please try again.",
        [{ text: "OK" }]
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
  },
  dismissKeyboard: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between', // Space between top content and bottom button
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  kittyContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  kittyImage: {
    width: '100%',
    height: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
});