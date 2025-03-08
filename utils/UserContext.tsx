import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
};

const defaultContext: UserContextType = {
  user: null,
  setUser: () => {},
  loading: true,
};

const USER_STORAGE_KEY = 'muscle_kitty_user_data';

export const UserContext = createContext<UserContextType>(defaultContext);

// Context provider component
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
  };

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First try to get from AsyncStorage (faster)
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If not in storage, try to get from auth state
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            saveUserToStorage(currentUser);
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
    <UserContext.Provider value={{ user, setUser: handleSetUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using user context
export const useUser = () => useContext(UserContext);