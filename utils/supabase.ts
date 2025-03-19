import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';


// Get environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://eanbeozedjxftwbgmvfn.supabase.co';
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbmJlb3plZGp4ZnR3YmdtdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Njk1NTksImV4cCI6MjA1NjU0NTU1OX0.j83PF9Zf8evMG5shlsL5FimDCc2HIutNqRJ-NTwwIKs';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Initialize Supabase client

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});


// Initialize auth session
(async () => {
  await supabase.auth.getSession();
})();

/**
 * Update user profile data in Supabase
 * @param userId User ID to update
 * @param userData Partial user data to update
 * @returns Success status and any error
 */
export const updateUserProfile = async (userId: string, userData: { 
  coins?: number;
  xp?: number; 
  level?: number;
  kittyName?: string;
  kittyBreed?: string;
  [key: string]: any;
}) => {
  try {
    
    // Check if the user exists in kitty_profiles, first by id then by user_id
    const { data: profileById, error: errorById } = await supabase
      .from('kitty_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    const { data: profileByUserId, error: errorByUserId } = await supabase
      .from('kitty_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Use whichever profile was found
    const profile = profileById || profileByUserId;
    const fetchError = (!profileById && !profileByUserId) ? errorById : null;
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return { success: false, error: fetchError };
    }
    
    let result;
    
    if (!profile) {
      // If profile doesn't exist, insert it
      const insertData = { 
        id: userId,
        user_id: userId, // Add the required user_id field
        ...userData 
      };
      
      result = await supabase
        .from('kitty_profiles')
        .insert(insertData);
    } else {
      // If profile exists, update it
      const updateData = {...userData};
      
      // Add user_id if it doesn't exist in the profile
      if (!profile.user_id) {
        updateData.user_id = userId;
      }
      
      // Determine which field to use for matching
      const matchField = profileById ? 'id' : 'user_id';
      
      result = await supabase
        .from('kitty_profiles')
        .update(updateData)
        .eq(matchField, userId);
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('Error updating profile in Supabase:', error.message);
      return { success: false, error };
    }
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Exception updating user profile:', error);
    return { success: false, error };
  }
};