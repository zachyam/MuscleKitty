import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { updateUserProfile } from './supabase';
import { User, KittyProfile } from '@/types';
import * as KittyStats from './kittyStats';
import { KITTY_IMAGES } from '@/app/name-kitty';

// Create context
type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  completeOnboarding: (kittyId: string) => Promise<void>;
  isFirstLogin: boolean;
  addCoins: (amount: number) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  updateUserAttributes: (updates: {
    coins?: number;
    xp?: number;
    level?: number;
    kittyName?: string;
    kittyBreed?: string;
    [key: string]: any;
  }) => Promise<User | null>;
};

const defaultContext: UserContextType = {
  user: null,
  setUser: () => {},
  loading: true,
  isFirstLogin: false,
  completeOnboarding: async () => {},
  addCoins: async () => {},
  addXP: async () => {},
  updateUserAttributes: async () => null,
};

const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';
const KITTY_NAME_KEY = 'muscle_kitty_name';

const USER_STORAGE_KEY = 'muscle_kitty_user_data';

export const UserContext = createContext<UserContextType>(defaultContext);

// Context provider component
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [selectedKitty, setSelectedKitty] = useState<KittyProfile | null>(null);

  const updateUserAttributes = async (updates: {
    coins?: number;
    xp?: number;
    level?: number;
    kittyName?: string;
    kittyBreedId?: string;
    fullName?: string;
    [key: string]: any;
  }) => {
    if (!user) return null;
    
    // If kittyBreedId is being updated, also update the avatarUrl
    if (updates.kittyBreedId !== undefined && KITTY_IMAGES[updates.kittyBreedId]) {
      updates.avatarUrl = KITTY_IMAGES[updates.kittyBreedId];
      console.log('Updated avatarUrl based on kittyBreedId:', updates.kittyBreedId);
    }
    
    const updatedUser = { ...user, ...updates };
    
    setUser(updatedUser);
    await saveUserToStorage(updatedUser);
    
    // Single database update with all changes
    console.log('Updating user in context updateUserAttributes:', updatedUser);
    
    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.kittyName !== undefined) dbUpdates.kitty_name = updates.kittyName;
    if (updates.kittyBreedId !== undefined) dbUpdates.kitty_breed_id = updates.kittyBreedId;
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.coins !== undefined) dbUpdates.coins = updates.coins;
    if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    
    await updateUserProfile(user.id, dbUpdates);
    
    return updatedUser;
  };
  
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
  
  // Check if the user has completed onboarding and fetch the latest data if they have
  const checkOnboardingStatus = async (userId: string) => {
    try {
      setLoading(true);
      
      // First check Supabase for user profile - this is the most accurate source
      const { data: profileData, error: profileError } = await supabase
        .from('kitty_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileData) {
        console.log('Found profile in database, user has completed onboarding:', profileData);
        setIsFirstLogin(false);
        
        // Update user data with the latest from Supabase
        if (user) {
          const updatedUser = { 
            ...user,
            hasCompletedOnboarding: true,
            coins: profileData.coins ?? user.coins ?? 0,
            xp: profileData.xp ?? user.xp ?? 10,
            level: profileData.level ?? user.level ?? 1,
            kittyName: profileData.kittyName ?? profileData.kitty_name ?? user.kittyName,
          };
          
          console.log('Updating user with fresh data from Supabase:', updatedUser);
          setUser(updatedUser);
          await saveUserToStorage(updatedUser);
          
          // Also update AsyncStorage onboarding status for future reference
          const onboardingKey = `onboarding_completed_${userId}`;
          await AsyncStorage.setItem(onboardingKey, 'true');
        }
        
        return;
      } else if (profileError && profileError.code !== 'PGRST116') {
        // Log real errors, not just "no rows returned" errors
        console.error('Error checking Supabase for user profile:', profileError);
      }
      
      // If no profile in Supabase, fall back to AsyncStorage
      const onboardingKey = `onboarding_completed_${userId}`;
      const storedStatus = await AsyncStorage.getItem(onboardingKey);
      
      if (storedStatus === 'true') {
        // User has completed onboarding according to AsyncStorage
        console.log('User has completed onboarding according to AsyncStorage');
        setIsFirstLogin(false);
        
        // We should still try to create their profile in Supabase
        if (user) {
          try {
            console.log('Creating profile in Supabase for existing user who completed onboarding');
            await updateUserProfile(userId, {
              coins: user.coins ?? 0,
              xp: user.xp ?? 10,
              level: user.level ?? 1, 
              kittyName: user.kittyName,
            });
          } catch (createError) {
            console.error('Error creating profile in Supabase:', createError);
          }
        }
      } else {
        // No record of completing onboarding in either AsyncStorage or Supabase
        console.log('User has not completed onboarding');
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
    if (!user) {
      console.log('completeOnboarding: No user available');
      return;
    }
    
    try {
      console.log('Starting onboarding completion with kittyId:', kittyId);
      setLoading(true);
      
      // Store completion status in AsyncStorage
      const onboardingKey = `onboarding_completed_${user.id}`;
      await AsyncStorage.setItem(onboardingKey, 'true');
      console.log('Stored onboarding completion status in AsyncStorage');
      
      // Update local state
      setIsFirstLogin(false);
      
      // Get the kitty image from the ID
      const avatarUrl = KITTY_IMAGES[kittyId] || require('@/assets/images/logo.png');
      console.log('Selected kitty image URL:', avatarUrl);
      
      // Try to get the kitty name from AsyncStorage
      let kittyName = '';
      try {
        const userKittyNameKey = `${KITTY_NAME_KEY}_${user.id}`;
        const storedKittyName = await AsyncStorage.getItem(userKittyNameKey);
        if (storedKittyName) {
          kittyName = storedKittyName;
          console.log('Found kitty name in AsyncStorage:', kittyName);
        }
      } catch (error) {
        console.error('Error getting kitty name:', error);
      }
      
      // Update local user object with avatar, kitty name, and initial coins/XP
      const updatedUser = { 
        ...user, 
        hasCompletedOnboarding: true,
        avatarUrl,
        kittyName: kittyName || user.kittyName || '',
        kittyBreedId: kittyId, // Make sure to set kittyBreedId
        coins: user.coins || 0, // Start with 0 coins
        xp: user.xp || 10,    // Start with 10 XP
        level: user.level || 1, // Start at level 1
        fullName: user.fullName || '',
      };
      console.log('Updated user object for onboarding completion:', updatedUser);
      
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      console.log('Saved updated user to storage');
      
      // Update Supabase profile
      const dbUpdates = {
        kitty_breed_id: kittyId,
        kitty_name: kittyName || user.kittyName || '',
        coins: updatedUser.coins,
        xp: updatedUser.xp,
        level: updatedUser.level,
        full_name: updatedUser.fullName,
      };
      console.log('Updating Supabase profile with:', dbUpdates);
      
      await updateUserProfile(user.id, dbUpdates);
      console.log('Updated Supabase profile successfully');
      
      console.log('Onboarding marked as completed for user with kitty ID:', user.id, kittyId);
      console.log('Initial user stats - Coins:', updatedUser.coins, 'XP:', updatedUser.xp, 'Level:', updatedUser.level);
      
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
        
        // Also try to get the selected kitty ID and name from AsyncStorage
        const kittyId = await AsyncStorage.getItem(SELECTED_KITTY_KEY);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // If we have a stored kitty ID, use the corresponding image
          if (kittyId && KITTY_IMAGES[kittyId]) {
            userData.avatarUrl = KITTY_IMAGES[kittyId];
            console.log('Using stored kitty image for user avatar, kittyId:', kittyId);
          }
          
          // Load kitty name if we have a user ID
          if (userData.id) {
            const userKittyNameKey = `${KITTY_NAME_KEY}_${userData.id}`;
            const storedKittyName = await AsyncStorage.getItem(userKittyNameKey);
            if (storedKittyName) {
              userData.kittyName = storedKittyName;
              console.log('Loaded kitty name:', storedKittyName);
            }
          }
          
          // Ensure userData has coins, xp, and level properties (for existing users)
          if (userData.hasCompletedOnboarding) {
            userData.coins = userData.coins ?? 0; // Default to 0 coins if not present
            userData.xp = userData.xp ?? 10;       // Default to 10 XP if not present
            userData.level = userData.level ?? 1;  // Default to level 1 if not present
            userData.fullName = userData.fullName || '';
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
            
            // Load kitty name if we have a user ID
            if (currentUser.id) {
              const userKittyNameKey = `${KITTY_NAME_KEY}_${currentUser.id}`;
              const storedKittyName = await AsyncStorage.getItem(userKittyNameKey);
              if (storedKittyName) {
                currentUser.kittyName = storedKittyName;
                console.log('Loaded kitty name:', storedKittyName);
              }
              
              // Try to fetch user profile from Supabase to get latest stats
              try {
                const { data: profile } = await supabase
                  .from('kitty_profiles')
                  .select('*')
                  .eq('user_id', currentUser.id)
                  .single();
                
                if (profile) {
                  console.log('Found user profile in Supabase:', profile);
                  // Update user with database values
                  console.log('Profile data:', profile);
                  
                  // Check for different possible column name variations
                  // Coin variations
                  if (profile.coins !== undefined) currentUser.coins = profile.coins;
                  
                  // XP variations
                  if (profile.xp !== undefined) currentUser.xp = profile.xp;

                  // Level variations
                  if (profile.level !== undefined) currentUser.level = profile.level;
                }
              } catch (dbError) {
                console.error('Error fetching profile from database:', dbError);
              }
            }
            
            // Ensure currentUser has coins, xp, and level properties (for existing users)
            if (currentUser.hasCompletedOnboarding) {
              currentUser.coins = currentUser.coins ?? 0; // Default to 0 coins if not present
              currentUser.xp = currentUser.xp ?? 10;        // Default to 10 XP if not present
              currentUser.level = currentUser.level ?? 1;  // Default to level 1 if not present
              currentUser.fullName = currentUser.fullName || '';
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

  // Function to add coins for the user
  const addCoins = async (amount: number) => {
    if (!user) return;
    
    try {
      const currentCoins = user.coins || 0;
      const newCoinTotal = currentCoins + amount;
      
      const updatedUser = {
        ...user,
        coins: newCoinTotal
      };
      
      // Update local state and AsyncStorage'
      console.log("Updating user in context add coins:", updatedUser);
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      
      // Update coins in Supabase
      if (user.id) {
        // Just use lowercase column names to match the database schema
        const result = await updateUserProfile(user.id, { 
          coins: newCoinTotal
        });
        
        if (!result.success) {
          console.warn('Failed to update coins in database, but local state is updated');
        }
      }
      
      console.log(`Added ${amount} coins. New total: ${newCoinTotal}`);
    } catch (error) {
      console.error('Error adding coins:', error);
    }
  };
  
  // Function to add XP for the user
  const addXP = async (amount: number) => {
    if (!user) return;
    
    try {
      const currentXP = user.xp || 10;
      const currentLevel = user.level || 1;
      
      // Calculate new XP and level using the kittyStats utility
      const newXP = currentXP + amount;
      const newLevel = KittyStats.calculateLevel(newXP);
      
      const updatedUser = {
        ...user,
        xp: newXP,
        level: newLevel
      };
      
      // Check if user leveled up
      if (newLevel > currentLevel) {
        console.log(`Level up! ${currentLevel} -> ${newLevel}`);
        // Could add celebration or notification here
      }
      
      // Update local state and AsyncStorage
      console.log("Updating user in context addXP:", updatedUser);
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      
      // Update XP and level in Supabase
      if (user.id) {
        // Just use lowercase column names to match the database schema
        const result = await updateUserProfile(user.id, { 
          xp: newXP,
          level: newLevel
        });
        
        if (!result.success) {
          console.warn('Failed to update XP in database, but local state is updated');
        }
      }
      
      console.log(`Added ${amount} XP. New total: ${updatedUser.xp}, Level: ${updatedUser.level}`);
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser: handleSetUser, 
      loading,
      completeOnboarding,
      isFirstLogin,
      addCoins,
      addXP,
      updateUserAttributes,
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using user context
export const useUser = () => useContext(UserContext);