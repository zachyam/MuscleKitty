import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { User, KittyProfile } from '@/types';

// Kitty images mapping for avatar selection
const KITTY_IMAGES: Record<string, any> = {
  '1': require('@/assets/images/munchkin.png'),
  '2': require('@/assets/images/orange-tabby.png'),
  '3': require('@/assets/images/russian-blue.png'),
  '4': require('@/assets/images/calico.png'),
  '5': require('@/assets/images/maine-coon.png'),
};

// Create context
type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  completeOnboarding: (kittyId: string) => Promise<void>;
  isFirstLogin: boolean;
};

const defaultContext: UserContextType = {
  user: null,
  setUser: () => {},
  loading: true,
  isFirstLogin: false,
  completeOnboarding: async () => {},
};

const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';

const USER_STORAGE_KEY = 'muscle_kitty_user_data';

export const UserContext = createContext<UserContextType>(defaultContext);

// Context provider component
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [selectedKitty, setSelectedKitty] = useState<KittyProfile | null>(null);

  // Function to save user to storage
  const saveUserToStorage = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving user data to storage:', error);
    }
  };

  // Set user and save to storage
  const handleSetUser = (userData: User | null) => {
    setUser(userData);
    saveUserToStorage(userData);
    
    // Check onboarding status when user is set
    if (userData) {
      checkOnboardingStatus(userData.id);
    }
  };
  
  // Check if the user has completed onboarding
  const checkOnboardingStatus = async (userId: string) => {
    try {
      setLoading(true);
      
      // Check if completed onboarding status is stored in AsyncStorage
      const onboardingKey = `onboarding_completed_${userId}`;
      const storedStatus = await AsyncStorage.getItem(onboardingKey);
      
      if (storedStatus === 'true') {
        // User has completed onboarding
        setIsFirstLogin(false);
      } else {
        // No record of completing onboarding
        setIsFirstLogin(true);
      }
    } catch (error) {
      console.error('Error in onboarding check:', error);
      setIsFirstLogin(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark onboarding as completed
  const completeOnboarding = async (kittyId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Store completion status in AsyncStorage
      const onboardingKey = `onboarding_completed_${user.id}`;
      await AsyncStorage.setItem(onboardingKey, 'true');
      
      // Update local state
      setIsFirstLogin(false);
      
      // Get the kitty image from the ID
      const avatarUrl = KITTY_IMAGES[kittyId] || require('@/assets/images/default-avatar.png');
      
      // Update local user object with avatar
      const updatedUser = { 
        ...user, 
        hasCompletedOnboarding: true,
        avatarUrl 
      };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      
      console.log('Onboarding marked as completed for user with kitty ID:', user.id, kittyId);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First try to get from AsyncStorage (faster)
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        // Also try to get the selected kitty ID from AsyncStorage
        const kittyId = await AsyncStorage.getItem(SELECTED_KITTY_KEY);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // If we have a stored kitty ID, use the corresponding image
          if (kittyId && KITTY_IMAGES[kittyId]) {
            userData.avatarUrl = KITTY_IMAGES[kittyId];
            console.log('Using stored kitty image for user avatar, kittyId:', kittyId);
          }
          
          setUser(userData);
          
          // Check onboarding status
          if (userData.id) {
            await checkOnboardingStatus(userData.id);
          }
        } else {
          // If not in storage, try to get from auth state
          const currentUser = await getCurrentUser();
          if (currentUser) {
            // If we have a stored kitty ID, use the corresponding image
            if (kittyId && KITTY_IMAGES[kittyId]) {
              currentUser.avatarUrl = KITTY_IMAGES[kittyId];
              console.log('Using stored kitty image for user avatar, kittyId:', kittyId);
            }
            
            setUser(currentUser);
            saveUserToStorage(currentUser);
            
            // Check onboarding status
            await checkOnboardingStatus(currentUser.id);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser: handleSetUser, 
      loading,
      completeOnboarding,
      isFirstLogin
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using user context
export const useUser = () => useContext(UserContext);