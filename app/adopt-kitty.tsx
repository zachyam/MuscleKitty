 import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useUser } from '@/utils/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

// Predefined kitty profiles
const KITTY_PROFILES = [
  {
    id: '1',
    breed: 'Munchkin',
    image: require('@/assets/images/munchkin.png'), // Used for display in this screen
    personality: 'Playful, Outgoing, Sociable 🤠',
    favoriteExercise: 'Push-ups 🏋️',
    favoriteFood: 'Tuna 🍣',
  },
  {
    id: '2',
    breed: 'Orange Tabby',
    image: require('@/assets/images/orange-tabby.png'),
    personality: 'Friendly, Affectionate, Intelligent 🧘',
    favoriteExercise: 'Yoga 🧘‍♀️',
    favoriteFood: 'Salmon 🐟',
  },
  {
    id: '3',
    breed: 'Russian Blue',
    image: require('@/assets/images/russian-blue.png'),
    personality: 'Sweet, Loyal, Sensitive 🦁',
    favoriteExercise: 'Squats 🏋️‍♂️',
    favoriteFood: 'Chicken 🍗',
  },
  {
    id: '4',
    breed: 'Calico',
    image: require('@/assets/images/calico.png'),
    personality: 'Thoughtful, Curious, Playful 🤓',
    favoriteExercise: 'Running 🏃‍♀️',
    favoriteFood: 'Beef 🌮',
  },
  {
    id: '5',
    breed: 'Maine Coon',
    image: require('@/assets/images/maine-coon.png'),
    personality: 'Smart, Active, Quirky 🦁',
    favoriteExercise: 'Bicep Curls 💪',
    favoriteFood: 'Duck 🦆',
  },
];

const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';
const AVATAR_DIRECTORY = `${FileSystem.documentDirectory}avatars/`;

type KittyProfile = typeof KITTY_PROFILES[0];

export default function AdoptKittyScreen() {
  const [selectedKittyIndex, setSelectedKittyIndex] = useState(0);
  const flatListRef = useRef<FlatList<KittyProfile>>(null);
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
  
  // Handle scrolling to next kitty
  const handleNextKitty = () => {
    if (selectedKittyIndex < KITTY_PROFILES.length - 1) {
      const newIndex = selectedKittyIndex + 1;
      setSelectedKittyIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };
  
  // Handle scrolling to previous kitty
  const handlePrevKitty = () => {
    if (selectedKittyIndex > 0) {
      const newIndex = selectedKittyIndex - 1;
      setSelectedKittyIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };
  
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
  
  // Handle scroll events to update selected kitty
  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setSelectedKittyIndex(newIndex);
  };

  // Render kitty item
  const renderKittyItem = ({ item, index }: { item: KittyProfile, index: number }) => {
    return (
      <View style={styles.kittySlide}>
        <View style={styles.kittyImageContainer}>
          <Image source={item.image} style={styles.kittyImage} resizeMode="contain" />
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <SafeAreaView style={styles.container}>
        
        {/* Title Card */}
        <View style={styles.titleCard}>
          <Text style={styles.titleText}>
            Adopt your new kitten!
          </Text>
        </View>
      
      {/* Kitty Selection Carousel */}
      <View style={styles.carouselContainer}>
        <TouchableOpacity 
          style={[
            styles.carouselButton, 
            styles.leftButton,
            selectedKittyIndex === 0 && styles.disabledButton
          ]} 
          onPress={handlePrevKitty}
          disabled={selectedKittyIndex === 0}
        >
          <ChevronLeft size={36} color={"#4CAF50"} />
        </TouchableOpacity>
        
        <FlatList
          ref={flatListRef}
          data={KITTY_PROFILES}
          renderItem={renderKittyItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          snapToInterval={width}
          snapToAlignment="center"
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={styles.carouselList}
        />
        
        <TouchableOpacity 
          style={[
            styles.carouselButton, 
            styles.rightButton,
            selectedKittyIndex === KITTY_PROFILES.length - 1 && styles.disabledButton
          ]} 
          onPress={handleNextKitty}
          disabled={selectedKittyIndex === KITTY_PROFILES.length - 1}
        >
          <ChevronRight size={36} color={"#4CAF50"} />
        </TouchableOpacity>
      </View>
      
      {/* Pagination Indicators */}
      <View style={styles.pagination}>
        {KITTY_PROFILES.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.paginationDot, 
              index === selectedKittyIndex && styles.activeDot
            ]} 
          />
        ))}
      </View>
      
      {/* Kitty Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Breed</Text>
          <Text style={styles.profileValue}>{selectedKitty.breed}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Personality</Text>
          <Text style={styles.profileValue}>{selectedKitty.personality}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Favorite Exercise</Text>
          <Text style={styles.profileValue}>{selectedKitty.favoriteExercise}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Favorite Food</Text>
          <Text style={styles.profileValue}>{selectedKitty.favoriteFood}</Text>
        </View>
      </View>
      
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
    width: '80%',
    height: '80%',
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