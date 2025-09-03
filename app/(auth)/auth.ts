import { User, AuthResponse } from '@/types';
import { supabase } from '../../supabase/supabase';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KITTY_IMAGES } from '@/app/(auth)/onboarding/name-kitty';

const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';
const KITTY_NAME_KEY = 'muscle_kitty_name';
const USER_STORAGE_KEY = 'muscle_kitty_user_data';

// Helper function to load user's complete profile including kitty data from Supabase
export const loadUserKittyData = async (user: User): Promise<User> => {
  try {
    if (!user || !user.id) {
      console.log('loadUserKittyData: No user or user.id provided');
      return user;
    }
    
    console.log('loadUserKittyData: Starting to load kitty data for user:', user.id);
    console.log('Initial user state:', user);
    
    // Use user-specific keys to store the kitty ID and name
    const userKittyKey = `${SELECTED_KITTY_KEY}_${user.id}`;
    const userKittyNameKey = `${KITTY_NAME_KEY}_${user.id}`;
    
    let updatedUser = { ...user };
    
    // FIRST: Try to fetch the latest data from Supabase for users who completed onboarding
    try {
      console.log('Fetching user profile from Supabase for user:', user.id);
      const { data: profileData, error } = await supabase
        .from('kitty_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData && !error) {
        console.log('Found user profile in Supabase:', profileData);
        
        // Ensure we have the correct kitty breed ID
        const kittyBreedId = profileData.kitty_breed_id;
        console.log('kittyBreedId from Supabase:', kittyBreedId);
        
        // Update user with the latest database values
        updatedUser = {
          ...updatedUser,
          coins: profileData.coins ?? updatedUser.coins ?? 0,
          xp: profileData.xp ?? updatedUser.xp ?? 10,
          level: profileData.level ?? updatedUser.level ?? 1,
          kittyName: profileData.kitty_name ?? updatedUser.kittyName,
          kittyBreedId: kittyBreedId,
          hasCompletedOnboarding: true,
        };
        
        console.log('Updated user after Supabase data:', updatedUser);
        
        // Always update avatarUrl based on kittyBreedId from database
        if (kittyBreedId && KITTY_IMAGES[kittyBreedId]) {
          updatedUser.avatarUrl = KITTY_IMAGES[kittyBreedId];
          console.log('Setting avatar from Supabase kittyBreedId:', kittyBreedId);
          
          // Update AsyncStorage with the latest kitty breed ID
          await AsyncStorage.setItem(userKittyKey, kittyBreedId);
          console.log('Updated AsyncStorage with kittyBreedId:', kittyBreedId);
        } else {
          console.log('No valid kittyBreedId found in Supabase or no matching image');
        }
        
        // If we have kitty data in Supabase, update AsyncStorage as well
        if (profileData.kitty_name) {
          await AsyncStorage.setItem(userKittyNameKey, profileData.kitty_name);
          console.log('Updated AsyncStorage with kitty name:', profileData.kitty_name);
        }
        
        console.log('Final user state after Supabase update:', updatedUser);
      } else if (error && error.code !== 'PGRST116') {
        // Only log real errors, not "no rows returned" errors
        console.error('Error fetching profile from Supabase:', error);
      } else {
        console.log('No profile found in Supabase for user:', user.id);
      }
    } catch (dbError) {
      console.error('Exception fetching profile from database:', dbError);
    }
    
    // SECOND: Fall back to local storage or supplement with local data
    // Get the selected kitty ID and name from AsyncStorage
    const kittyId = await AsyncStorage.getItem(userKittyKey);
    console.log('kittyId from AsyncStorage:', kittyId);
    
    const kittyName = !updatedUser.kittyName ? await AsyncStorage.getItem(userKittyNameKey) : null;
    console.log('kittyName from AsyncStorage:', kittyName);
    
    // If we have a stored kitty ID and didn't get one from Supabase, use the corresponding image
    if (kittyId && !updatedUser.kittyBreedId && KITTY_IMAGES[kittyId]) {
      console.log(`Loading user ${user.id} avatar with kitty ID from AsyncStorage:`, kittyId);
      updatedUser.avatarUrl = KITTY_IMAGES[kittyId];
      updatedUser.kittyBreedId = kittyId;
      console.log('Updated user with AsyncStorage kitty data:', updatedUser);
    }
    
    // If we have a stored kitty name and didn't get one from Supabase, add it to the user object
    if (kittyName && !updatedUser.kittyName) {
      console.log(`Loading user ${user.id} kitty name from AsyncStorage:`, kittyName);
      updatedUser.kittyName = kittyName;
    } else if (!updatedUser.kittyName) {
      // Try to get kitty name from Supabase user metadata as a fallback
      const { data } = await supabase.auth.getUser();
      const metadataKittyName = data?.user?.user_metadata?.kittyName;
      console.log('kittyName from user metadata:', metadataKittyName);
      
      if (metadataKittyName) {
        console.log('Found kitty name in user metadata:', metadataKittyName);
        updatedUser.kittyName = metadataKittyName;
        
        // Store it in AsyncStorage for future use
        await AsyncStorage.setItem(userKittyNameKey, metadataKittyName);
      }
    }
    
    // Save the most up-to-date user data to AsyncStorage
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    console.log('Final user state after all updates:', updatedUser);
    
    return updatedUser;
  } catch (error) {
    console.error('Error loading user kitty data:', error);
    return user;
  }
};

// Login with OAuth (Google)
export const loginWithSocialMedia = async (socialMediaProvider: 'google' | 'github' | 'facebook'): Promise<AuthResponse> => {
  try {
    // Clear any existing session first to prevent issues
    await supabase.auth.signOut();
    console.log(`Starting ${socialMediaProvider} login process...`);
    
    // Get the URL from Supabase for OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: socialMediaProvider as any,
      options: {
        redirectTo: 'musclekitty://auth/callback',
        queryParams: {
          prompt: 'select_account consent'
        }
      }
    });
    
    if (error) {
      console.error('Error getting OAuth URL:', error);
      throw error;
    }
    if (!data?.url) throw new Error('No auth URL returned from Supabase');
    
    console.log('Opening browser with URL:', data.url);
    
    // Open a browser for the user to authenticate
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      Platform.OS === 'ios' ? 'musclekitty://' : 'musclekitty://auth/callback',
      { showInRecents: true }
    );
    
    console.log('WebBrowser result:', result);
    
    // Only try to extract the token if we have a successful return URL
    if (result.type === 'success' && result.url) {
      // Extract token manually from URL
      try {
        const url = new URL(result.url);
        const hashParams = url.hash.substring(1).split('&');
        const params: Record<string, string> = {};
        
        hashParams.forEach(param => {
          const [key, value] = param.split('=');
          params[key] = value;
        });
        
        console.log('URL params found:', Object.keys(params));
        
        if (params.access_token) {
          console.log('Access token found in URL, setting session manually');
          
          // Set the session manually
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token || '',
          });
          
          console.log('setSession result:', sessionData?.session ? 'Session set' : 'Session not set',
                      'Error:', sessionError);
          
          if (sessionData?.session) {
            // We have a session, get the user data
            const { data: userData, error: userError } = await supabase.auth.getUser();
            console.log('User data:', userData?.user ? 'User exists' : 'No user',
                'User error:', userError);
            
            if (userData?.user) {
              console.log('User metadata:', userData.user.user_metadata);
              
              // Map the user data to our User type
              const user: User = {
                id: userData.user.id,
                email: userData.user.email || '',
                fullName: userData.user.user_metadata?.full_name || 
                      userData.user.user_metadata?.name || 
                      userData.user.email?.split('@')[0] || '',
                avatarUrl: userData.user.user_metadata?.avatar_url,
              };
              
              // Override with kitty avatar if available
              const userWithKitty = await loadUserKittyData(user);
              
              return {
                user: userWithKitty,
                token: sessionData.session.access_token,
              };
            }
          }
        }
      } catch (error) {
        console.error('Error parsing auth redirect URL:', error);
      }
    }
    
    // If we got here, authentication failed or was cancelled
    if (result.type === 'cancel') {
      console.log('User cancelled the authentication');
      throw new Error('Authentication cancelled');
    } else {
      console.log('Authentication completed but no session was created');
      throw new Error('Authentication failed - No session created after redirect');
    }
  } catch (error) {
    console.error('Error logging in with:', socialMediaProvider);
    return { 
      user: {} as User, 
      token: '', 
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    // First get the current user to save their ID
    const currentUser = await supabase.auth.getUser();
    const userId = currentUser?.data?.user?.id;
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      throw error;
    }
    
    // Clear user data from AsyncStorage
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    
    // Clear any temporary cache that might be used across tabs
    // This will force reloading fresh data when logging in again
    if (userId) {
      console.log('Cleaning up temporary avatar cache for user', userId);
      // Create a backup of kitty settings under user-specific keys before logout
      const userKittyKey = `${SELECTED_KITTY_KEY}_${userId}`;
      const userKittyNameKey = `${KITTY_NAME_KEY}_${userId}`;
      const kittyBreedId = await AsyncStorage.getItem(userKittyKey);
      const kittyName = await AsyncStorage.getItem(userKittyNameKey);
      
      // Store these as backup values with a different prefix to avoid conflicts
      if (kittyBreedId) {
        await AsyncStorage.setItem(`backup_${userKittyKey}`, kittyBreedId);
      }
      if (kittyName) {
        await AsyncStorage.setItem(`backup_${userKittyNameKey}`, kittyName);
      }
    }
    
    // This ensures we don't use stale avatar data across different users
    console.log('Logout complete, user data cleared from memory');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    // Get the base user data from auth
    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      fullName: data.user.user_metadata?.name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };
    
    // Load all kitty data (avatar and name)
    const userWithKittyData = await loadUserKittyData(user);
    
    return userWithKittyData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get current session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('getSession data:', data?.session ? 'Session exists' : 'No session');
    
    if (error) {
      console.error('Session error:', error);
      throw error;
    }
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getSession();
    console.log('isAuthenticated check result:', !!session);
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};