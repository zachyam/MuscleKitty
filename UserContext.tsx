import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  isFirstLogin: boolean;
  completeOnboarding: () => void;
};

const defaultContext: UserContextType = {
  user: null,
  setUser: () => {},
  loading: true,
  isFirstLogin: false,
  completeOnboarding: () => {},
};

const USER_STORAGE_KEY = 'muscle_kitty_user_data';
const ONBOARDING_COMPLETED_KEY = 'muscle_kitty_onboarding_completed';

export const UserContext = createContext<UserContextType>(defaultContext);

// Context provider component
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

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
    
    // Check if this is a first login
    if (userData !== null) {
      checkOnboardingStatus();
    }
  };
  
  // Check if onboarding has been completed
  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      setIsFirstLogin(onboardingCompleted === null);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsFirstLogin(false);
    }
  };
  
  // Mark onboarding as completed
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setIsFirstLogin(false);
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  };

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First try to get from AsyncStorage (faster)
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          await checkOnboardingStatus();
        } else {
          // If not in storage, try to get from auth state
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            saveUserToStorage(currentUser);
            await checkOnboardingStatus();
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
      isFirstLogin, 
      completeOnboarding 
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using user context
export const useUser = () => useContext(UserContext);