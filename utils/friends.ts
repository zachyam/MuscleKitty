import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Friend profile interface
export interface FriendProfile {
  id: string;
  kitty_hash: string;  // Database uses snake_case
  user_id: string;     // Database uses snake_case
  kitty_name: string;  // Database uses snake_case
  kitty_type: string;  // Database uses snake_case
  level: number;
  xp: number;
  created_at: string;  // Database uses snake_case
  updated_at: string;  // Database uses snake_case
  
  // These are for our app's usage (camelCase)
  kittyHash?: string;
  userId?: string;
  kittyName?: string;
  kittyType?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Register a kitty profile in Supabase so friends can find it
export const registerKittyProfile = async (
  userId: string,
  kittyName: string,
  kittyType: string,
  kittyHash: string
): Promise<boolean> => {
  try {
    // First check if the profile already exists
    const { data: existingProfile } = await supabase
      .from('kitty_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Default values for a new kitty
    const level = 1;
    const xp = 0;
    
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('kitty_profiles')
        .update({
          kitty_name: kittyName,
          kitty_type: kittyType,
          kitty_hash: kittyHash,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      // Create new profile
      const { error } = await supabase
        .from('kitty_profiles')
        .insert({
          user_id: userId,
          kitty_name: kittyName,
          kitty_type: kittyType,
          kitty_hash: kittyHash,
          level,
          xp,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error registering kitty profile:', error);
    return false;
  }
};

// Update a kitty's level and XP
export const updateKittyStats = async (userId: string, level: number, xp: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('kitty_profiles')
      .update({
        level,
        xp,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating kitty stats:', error);
    return false;
  }
};

// Retrieve a friend's profile by their kitty hash
export const getFriendProfileByHash = async (kittyHash: string): Promise<FriendProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('kitty_profiles')
      .select('*')
      .eq('kitty_hash', kittyHash)
      .single();
    
    if (error) throw error;
    
    // Map snake_case DB fields to camelCase for app usage
    if (data) {
      data.kittyHash = data.kitty_hash;
      data.userId = data.user_id;
      data.kittyName = data.kitty_name;
      data.kittyType = data.kitty_type;
      data.createdAt = data.created_at;
      data.updatedAt = data.updated_at;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching friend profile by hash:', error);
    return null;
  }
};

// Add a friend association
export const addFriend = async (userId: string, friendKittyHash: string): Promise<boolean> => {
  try {
    // First check if the friend relationship already exists
    const { data: existingFriendship } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_kitty_hash', friendKittyHash)
      .single();
    
    if (existingFriendship) {
      // Already friends, nothing to do
      return true;
    }
    
    // Add the friendship
    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_kitty_hash: friendKittyHash,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding friend:', error);
    return false;
  }
};

// Remove a friend association
export const removeFriend = async (userId: string, friendKittyHash: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_kitty_hash', friendKittyHash);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
};

// Get all friend profiles
export const getFriendProfiles = async (userId: string): Promise<FriendProfile[]> => {
  try {
    // First get the friend relationships
    const { data: friendRelationships, error: friendError } = await supabase
      .from('friends')
      .select('friend_kitty_hash')
      .eq('user_id', userId);
    
    if (friendError) throw friendError;
    
    // If no friends, return empty array
    if (!friendRelationships || friendRelationships.length === 0) {
      return [];
    }
    
    // Extract the hash values
    const friendHashes = friendRelationships.map(fr => fr.friend_kitty_hash);
    
    // Fetch all friend profiles in a single query
    const { data: friendProfiles, error: profileError } = await supabase
      .from('kitty_profiles')
      .select('*')
      .in('kitty_hash', friendHashes);
    
    if (profileError) throw profileError;
    
    // Map snake_case DB fields to camelCase for app usage
    if (friendProfiles) {
      for (const profile of friendProfiles) {
        profile.kittyHash = profile.kitty_hash;
        profile.userId = profile.user_id;
        profile.kittyName = profile.kitty_name;
        profile.kittyType = profile.kitty_type;
        profile.createdAt = profile.created_at;
        profile.updatedAt = profile.updated_at;
      }
    }
    
    return friendProfiles || [];
  } catch (error) {
    console.error('Error fetching friend profiles:', error);
    return [];
  }
};

// Get current user's kitty hash
export const getCurrentUserKittyHash = async (userId: string): Promise<string | null> => {
  try {
    // Try to get from Supabase first
    const { data, error } = await supabase
      .from('kitty_profiles')
      .select('kitty_hash')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If not in Supabase, try to compute it using the pattern in name-kitty.tsx
      const kittyNameKey = `muscle_kitty_name_${userId}`;
      const kittyName = await AsyncStorage.getItem(kittyNameKey);
      
      if (kittyName) {
        const kittyHashKey = `${kittyName}_${userId}`;
        return stringHash(kittyHashKey).toString();
      }
      return null;
    }
    
    return data?.kitty_hash || null;
  } catch (error) {
    console.error('Error getting current user kitty hash:', error);
    return null;
  }
};

// The hash function from name-kitty.tsx
const stringHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};