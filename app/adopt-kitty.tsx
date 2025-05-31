 import React, { useState, useRef, useEffect } from 'react';
import { 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useUser } from '@/utils/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KITTY_PROFILES } from '@/components/AdoptKittyScreenComponents';
import AdoptKittyScreenComponents from '@/components/AdoptKittyScreenComponents';

const { width } = Dimensions.get('window');

const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';

type KittyProfile = typeof KITTY_PROFILES[0];

export default function AdoptKittyScreen() {
  const [selectedKittyIndex, setSelectedKittyIndex] = useState(0);
  const router = useRouter();
  const { completeOnboarding, isFirstLogin, user, setUser } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start with opacity 0
  
  // Remove immediate redirect for testing purposes
  useEffect(() => {
    console.log('AdoptKitty screen loaded, isFirstLogin:', isFirstLogin);
    // The navigation guard is now handled in the root layout
    
    // Fade in the screen when it loads
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const selectedKitty = KITTY_PROFILES[selectedKittyIndex];
  
  // Handle adopting the selected kitty
  const handleAdopt = async () => {
    try {
      console.log('User is adopting kitty:', selectedKitty.breed);

      // If we have a user ID, save the kitty ID with the user ID
      if (user?.id) {
        const userKittyKey = `${SELECTED_KITTY_KEY}_${user.id}`;
        await AsyncStorage.setItem(userKittyKey, selectedKitty.id);
        console.log(`Saved kitty ID ${selectedKitty.id} for user ${user.id}`);
      } else {
        // Fallback to the generic key if no user ID (shouldn't happen)
        await AsyncStorage.setItem(SELECTED_KITTY_KEY, selectedKitty.id);
        console.log('Saved kitty ID to generic key (no user ID):', selectedKitty.id);
      }
      
      // Store the selected kitty ID but don't complete onboarding yet
      // The final step of the onboarding process will be in the name-kitty page
      console.log('Selected kitty:', selectedKitty.id);
      
      // Fade out before navigation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Navigate to name kitty page after fade out completes
        console.log('Navigating to name kitty page');
        router.push('/name-kitty');
      });
    } catch (error) {
      console.error('Error adopting kitty:', error);
      // Still navigate even if there's an error
      router.push('/name-kitty');
    }
  };
  

  return (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <SafeAreaView style={styles.container}>
        
      <AdoptKittyScreenComponents
        selectedKittyIndex={selectedKittyIndex}
        setSelectedKittyIndex={setSelectedKittyIndex}/>
      
      {/* Adopt Button */}
        <TouchableOpacity style={styles.adoptButton} onPress={handleAdopt}>
          <Text style={styles.adoptButtonText}>Adopt</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
    marginTop: 20,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  carouselContainer: {
    width: '100%',
    height: 250,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  carouselList: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  kittySlide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kittyImageContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  kittyImage: {
    width: 100,
    height: 100,
  },
  carouselButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leftButton: {
    left: 20,
  },
  rightButton: {
    right: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0d0d0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    width: '100%',
  },
  adoptButton: {
    backgroundColor: Colors.primary,
    width: '85%',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
});