import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Friendship status enum
export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

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
  friendship_status?: FriendshipStatus; // Friendship status
  
  // These are for our app's usage (camelCase)
  kittyHash?: string;
  userId?: string;
  kittyName?: string;
  kittyType?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: FriendshipStatus; // Alias for friendship_status for app use
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
    const coins = 0;
    
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
          coins,
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

// Update only the kitty name in the profile
export const updateKittyName = async (
  userId: string,
  kittyName: string
): Promise<boolean> => {
  try {
    // Update existing profile name only
    const { error } = await supabase
      .from('kitty_profiles')
      .update({
        kitty_name: kittyName,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating kitty name:', error);
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

// Add a friend association (sends a friend request)
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
      // Already has a relationship, nothing to do
      return true;
    }
    
    // Get the friend's user ID from the kitty hash
    const { data: friendProfile } = await supabase
      .from('kitty_profiles')
      .select('user_id')
      .eq('kitty_hash', friendKittyHash)
      .single();
    
    if (!friendProfile) {
      console.error('Friend profile not found for hash:', friendKittyHash);
      return false;
    }
    
    // Add the friendship as pending
    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_kitty_hash: friendKittyHash,
        friendship_status: FriendshipStatus.PENDING,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error adding friend:', error);
    return false;
  }
};

// Accept a friend request
export const acceptFriendRequest = async (userId: string, requesterUserId: string): Promise<boolean> => {
  try {
    // First get the current user's kitty hash
    const { data: currentUserProfile } = await supabase
      .from('kitty_profiles')
      .select('kitty_hash')
      .eq('user_id', userId)
      .single();
    
    if (!currentUserProfile?.kitty_hash) {
      console.error('Could not find current user kitty hash');
      return false;
    }
    
    // Find the pending request
    const { data: pendingRequest, error: requestError } = await supabase
      .from('friends')
      .select('user_id, friend_kitty_hash')
      .eq('user_id', requesterUserId)
      .eq('friend_kitty_hash', currentUserProfile.kitty_hash)
      .eq('friendship_status', FriendshipStatus.PENDING)
      .single();
    
    if (requestError || !pendingRequest) {
      console.error('Could not find pending request:', requestError);
      return false;
    }
    
    // Update the friend request to accepted
    const { error: updateError } = await supabase
      .from('friends')
      .update({ friendship_status: FriendshipStatus.ACCEPTED })
      .eq('user_id', requesterUserId)
      .eq('friend_kitty_hash', currentUserProfile.kitty_hash)
      .eq('friendship_status', FriendshipStatus.PENDING);
    
    if (updateError) throw updateError;
    
    // Get the requester's kitty hash
    const { data: requesterProfile } = await supabase
      .from('kitty_profiles')
      .select('kitty_hash')
      .eq('user_id', requesterUserId)
      .single();
    
    if (!requesterProfile?.kitty_hash) {
      console.error('Could not find requester kitty hash');
      return false;
    }
    
    // Create the reverse relationship (current user to requester)
    const { error: insertError } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_kitty_hash: requesterProfile.kitty_hash,
        friendship_status: FriendshipStatus.ACCEPTED,
        created_at: new Date().toISOString()
      });
    
    if (insertError) throw insertError;
    
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
};

// Reject a friend request
export const rejectFriendRequest = async (userId: string, requesterUserId: string): Promise<boolean> => {
  try {
    // Get the current user's kitty hash
    const { data: currentUserProfile } = await supabase
      .from('kitty_profiles')
      .select('kitty_hash')
      .eq('user_id', userId)
      .single();
    
    if (!currentUserProfile?.kitty_hash) {
      console.error('Could not find current user kitty hash');
      return false;
    }
    
    // Find the pending request
    const { data: pendingRequest, error: requestError } = await supabase
      .from('friends')
      .select('user_id, friend_kitty_hash')
      .eq('user_id', requesterUserId)
      .eq('friend_kitty_hash', currentUserProfile.kitty_hash)
      .eq('friendship_status', FriendshipStatus.PENDING)
      .single();
    
    if (requestError || !pendingRequest) {
      console.error('Could not find pending request:', requestError);
      return false;
    }
    
    // Update the friend request to rejected
    const { error } = await supabase
      .from('friends')
      .update({ friendship_status: FriendshipStatus.REJECTED })
      .eq('user_id', requesterUserId)
      .eq('friend_kitty_hash', currentUserProfile.kitty_hash)
      .eq('friendship_status', FriendshipStatus.PENDING);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
};

// Remove a friend association (bi-directional)
export const removeFriend = async (userId: string, friendKittyHash: string): Promise<boolean> => {
  try {
    // First remove from the user's direction
    const { error: error1 } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_kitty_hash', friendKittyHash);
    
    if (error1) throw error1;
    
    // Get friend's user ID to delete the reverse relationship
    const { data: friendProfile } = await supabase
      .from('kitty_profiles')
      .select('user_id')
      .eq('kitty_hash', friendKittyHash)
      .single();
    
    if (friendProfile) {
      // Get current user's kitty hash
      const { data: userProfile } = await supabase
        .from('kitty_profiles')
        .select('kitty_hash')
        .eq('user_id', userId)
        .single();
      
      if (userProfile?.kitty_hash) {
        // Delete from the other direction
        const { error: error2 } = await supabase
          .from('friends')
          .delete()
          .eq('user_id', friendProfile.user_id)
          .eq('friend_kitty_hash', userProfile.kitty_hash);
        
        if (error2) {
          console.error('Error removing reverse friendship:', error2);
          // Continue anyway since we've already removed one direction
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
};

// Get all friend profiles (only accepted friendships)
export const getFriendProfiles = async (userId: string): Promise<FriendProfile[]> => {
  try {
    // Get friend relationships that are accepted
    const { data: friendRelationships, error: friendError } = await supabase
      .from('friends')
      .select('friend_kitty_hash, friendship_status')
      .eq('user_id', userId)
      .eq('friendship_status', FriendshipStatus.ACCEPTED);
    
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
        // Set status to accepted for these profiles
        profile.status = profile.friendship_status || FriendshipStatus.ACCEPTED;
      }
    }
    
    return friendProfiles || [];
  } catch (error) {
    console.error('Error fetching friend profiles:', error);
    return [];
  }
};

// Get pending friend requests (requests sent to the user)
export const getPendingFriendRequests = async (userId: string): Promise<FriendProfile[]> => {
  try {
    // First get the current user's kitty hash
    const { data: userProfile } = await supabase
      .from('kitty_profiles')
      .select('kitty_hash')
      .eq('user_id', userId)
      .single();
    
    if (!userProfile?.kitty_hash) {
      console.error('Could not find current user kitty hash');
      return [];
    }
    
    // Find friend requests where current user's kitty hash is the target
    // and friendship_status is pending
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('friends')
      .select('user_id, friend_kitty_hash, friendship_status')
      .eq('friend_kitty_hash', userProfile.kitty_hash)
      .eq('friendship_status', FriendshipStatus.PENDING);
    
    if (requestsError) throw requestsError;
    
    // If no pending requests, return empty array
    if (!pendingRequests || pendingRequests.length === 0) {
      return [];
    }
    
    // Extract the requesting user IDs
    const requestingUserIds = pendingRequests.map(req => req.user_id);
    
    // Fetch all requestor profiles in a single query
    const { data: requestorProfiles, error: profileError } = await supabase
      .from('kitty_profiles')
      .select('*')
      .in('user_id', requestingUserIds);
    
    if (profileError) throw profileError;
    
    // Map snake_case DB fields to camelCase for app usage
    if (requestorProfiles) {
      for (const profile of requestorProfiles) {
        profile.kittyHash = profile.kitty_hash;
        profile.userId = profile.user_id;
        profile.kittyName = profile.kitty_name;
        profile.kittyType = profile.kitty_type;
        profile.createdAt = profile.created_at;
        profile.updatedAt = profile.updated_at;
        // Set status to pending for these profiles
        profile.status = profile.friendship_status || FriendshipStatus.PENDING;
      }
    }
    
    return requestorProfiles || [];
  } catch (error) {
    console.error('Error fetching pending friend requests:', error);
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

