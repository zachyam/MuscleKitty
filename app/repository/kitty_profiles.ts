import { supabase } from '@/supabase/supabase';

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
  kitty_name?: string;
  kitty_breed_id?: string;
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
      console.log('updateData', updateData)
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

export const deleteSupabaseUser = async (userId: string) => {
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;
  const response = await fetch(
    'https://eanbeozedjxftwbgmvfn.supabase.co/functions/v1/delete-user',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || 'Unknown error' };
  }

  return { success: true };
};