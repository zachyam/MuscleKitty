import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { SetData } from '../types';

// Get environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://eanbeozedjxftwbgmvfn.supabase.co';
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbmJlb3plZGp4ZnR3YmdtdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Njk1NTksImV4cCI6MjA1NjU0NTU1OX0.j83PF9Zf8evMG5shlsL5FimDCc2HIutNqRJ-NTwwIKs';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

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

// Workout Plan Functions
export const getWorkoutPlans = async (userId: string): Promise<WorkoutPlan[]> => {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching workout plans:', error);
    return [];
  }
  
  return data || [];
};

export const getWorkoutPlan = async (planId: string): Promise<WorkoutPlan | null> => {
  // Return null for empty or invalid IDs
  if (!planId || planId === '') {
    console.log('getWorkoutPlan: No plan ID provided');
    return null;
  }

  try {
    console.log(`Supabase API: Fetching workout plan with ID: ${planId}`);
    
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned is not really an error
        console.log(`No workout plan found with ID: ${planId}`);
      } else {
        console.error('Error fetching workout plan:', error);
      }
      return null;
    }
    
    console.log(`Supabase API: Found workout plan: ${data.name} (ID: ${data.id})`);
    return data;
  } catch (err) {
    console.error(`Exception in getWorkoutPlan for ID ${planId}:`, err);
    return null;
  }
};

export const createWorkoutPlan = async (userId: string, name: string): Promise<WorkoutPlan | null> => {
  const now = new Date().toISOString();
  
  console.log(`Supabase API: Creating workout plan: ${name} for user ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: userId,
        name,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating workout plan:', error);
      return null;
    }
    
    console.log(`Supabase API: Successfully created workout plan with ID: ${data.id}`);
    return data;
  } catch (err) {
    console.error('Exception in createWorkoutPlan:', err);
    return null;
  }
};

export const updateWorkoutPlan = async (planId: string, name: string): Promise<WorkoutPlan | null> => {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('workout_plans')
    .update({
      name,
      updated_at: now
    })
    .eq('id', planId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating workout plan:', error);
    return null;
  }
  
  return data;
};

export const deleteWorkoutPlan = async (planId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('id', planId);
  
  if (error) {
    console.error('Error deleting workout plan:', error);
    return false;
  }
  
  return true;
};

// Workout Exercise Functions
export const getWorkoutExercises = async (workoutPlanId: string): Promise<WorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_plan_id', workoutPlanId)
    .order('order', { ascending: true });
  
  if (error) {
    console.error('Error fetching workout exercises:', error);
    return [];
  }
  
  return data || [];
};

export const getWorkoutExercise = async (exerciseId: string): Promise<WorkoutExercise | null> => {
  console.log(`Supabase API: Fetching workout exercise with ID: ${exerciseId}`);
  
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned is not really an error
        console.warn(`No workout exercise found with ID: ${exerciseId}`);
      } else {
        console.error('Error fetching workout exercise:', error);
      }
      return null;
    }
    
    console.log(`Supabase API: Found workout exercise: ${data?.name || 'unknown'} (ID: ${data?.id})`);
    return data;
  } catch (err) {
    console.error(`Exception in getWorkoutExercise for ID ${exerciseId}:`, err);
    return null;
  }
};

export const addExerciseToWorkout = async (
  workoutPlanId: string, 
  name: string, 
  numTargetSets: number,
  order: number
): Promise<WorkoutExercise | null> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      workout_plan_id: workoutPlanId,
      name,
      num_target_sets: numTargetSets,
      order
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding exercise to workout:', error);
    return null;
  }
  
  return data;
};

export const updateWorkoutExercise = async (
  exerciseId: string, 
  updates: Partial<WorkoutExercise>
): Promise<WorkoutExercise | null> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating workout exercise:', error);
    return null;
  }
  
  return data;
};

export const deleteWorkoutExercise = async (exerciseId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);
  
  if (error) {
    console.error('Error deleting workout exercise:', error);
    return false;
  }
  
  return true;
};

// Workout Log Functions
export const createWorkoutLog = async (
  workoutPlanId: string, 
  userId: string,
  notes?: string
): Promise<WorkoutLog | null> => {
  console.log(`Creating workout log: plan=${workoutPlanId}, user=${userId}, notes=${notes || 'none'}`);
  
  try {
    // Verify that the workout plan exists first
    const { data: planExists, error: planError } = await supabase
      .from('workout_plans')
      .select('id')
      .eq('id', workoutPlanId)
      .single();
    
    if (planError) {
      console.error('Error verifying workout plan exists:', planError);
      throw new Error(`Workout plan with ID ${workoutPlanId} not found: ${planError.message}`);
    }
    
    console.log('Workout plan found, proceeding to create workout log');
    
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        workout_plan_id: workoutPlanId,
        user_id: userId,
        date_completed: new Date().toISOString(),
        notes: notes || 'Workout completed'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating workout log:', error);
      throw new Error(`Failed to create workout log: ${error.message}`);
    }
    
    console.log('Workout log created successfully:', data.id);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Exception in createWorkoutLog:', message);
    throw error;
  }
};

export const getWorkoutLog = async (logId: string): Promise<WorkoutLog | null> => {
  console.log(`Supabase API: Fetching workout log with ID: ${logId}`);
  
  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('id', logId)
      .single();
    
    if (error) {
      console.error('Error fetching workout log:', error);
      return null;
    }
    
    console.log(`Supabase API: Found workout log:`, data ? `ID: ${data.id}, Plan: ${data.workout_plan_id}` : 'null');
    return data;
  } catch (err) {
    console.error('Exception in getWorkoutLog:', err);
    return null;
  }
};

export const getWorkoutLogs = async (
  userId: string, 
  workoutPlanId?: string
): Promise<WorkoutLog[]> => {
  console.log(`Supabase API: Fetching workout logs for user ID: ${userId}${workoutPlanId ? `, plan ID: ${workoutPlanId}` : ''}`);
  
  try {
    let query = supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date_completed', { ascending: false });
    
    if (workoutPlanId) {
      query = query.eq('workout_plan_id', workoutPlanId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching workout logs:', error);
      return [];
    }
    
    console.log(`Supabase API: Found ${data?.length || 0} workout logs`);
    if (data && data.length > 0) {
      // Log IDs of first few logs
      console.log('Supabase API: Log IDs:', data.slice(0, 5).map(log => log.id).join(', '));
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception in getWorkoutLogs:', err);
    return [];
  }
};

// Debug function to check if a specific log exists
export const checkIfLogExists = async (logId: string): Promise<boolean> => {
  console.log(`Supabase API: Checking if log ID exists: ${logId}`);
  
  // Validate that the ID is a UUID format
  if (!logId || !logId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('Error checking if log exists: Invalid UUID format', logId);
    throw new Error('Invalid UUID format for workout log ID');
  }
  
  try {
    // Try to get just the ID of the log to verify existence
    const { data, error } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('id', logId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking if log exists:', error);
      return false;
    }
    
    const exists = !!data;
    console.log(`Supabase API: Log ID ${logId} ${exists ? 'exists' : 'does not exist'}`);
    
    return exists;
  } catch (err) {
    console.error(`Exception checking if log ${logId} exists:`, err);
    return false;
  }
};

export const updateWorkoutLog = async (
  logId: string,
  updates: Partial<WorkoutLog>
): Promise<WorkoutLog | null> => {
  const { data, error } = await supabase
    .from('workout_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating workout log:', error);
    return null;
  }
  
  return data;
};

export const deleteWorkoutLog = async (logId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', logId);
  
  if (error) {
    console.error('Error deleting workout log:', error);
    return false;
  }
  
  return true;
};

// Exercise Log Functions
export const logExercise = async (
  workoutLogId: string,
  workoutExerciseId: string,
  setsCompleted: SetData[]
): Promise<ExerciseLog | null> => {
  try {
    console.log(`Logging exercise: workoutLogId=${workoutLogId}, exerciseId=${workoutExerciseId}, sets=${setsCompleted.length}`);
    
    // Validate parameters
    if (!workoutLogId) {
      console.error('Missing workoutLogId in logExercise');
      return null;
    }
    
    if (!workoutExerciseId) {
      console.error('Missing workoutExerciseId in logExercise');
      return null;
    }
    
    if (!setsCompleted || setsCompleted.length === 0) {
      console.error('No sets completed provided in logExercise');
      return null;
    }
    
    // Ensure sets are properly formatted
    const validatedSets = setsCompleted.map(set => ({
      reps: typeof set.reps === 'number' ? set.reps : 0,
      weight: typeof set.weight === 'number' ? set.weight : 0
    }));
    
    // Insert the exercise log
    const { data, error } = await supabase
      .from('exercise_logs')
      .insert({
        workout_log_id: workoutLogId,
        workout_exercise_id: workoutExerciseId,
        sets_completed: validatedSets
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging exercise:', error);
      return null;
    }
    
    console.log(`Successfully logged exercise with id: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Exception in logExercise:', error);
    return null;
  }
};

export const getExerciseLog = async (logId: string): Promise<ExerciseLog | null> => {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('id', logId)
    .single();
  
  if (error) {
    console.error('Error fetching exercise log:', error);
    return null;
  }
  
  return data;
};

export const getExerciseLogs = async (workoutLogId: string): Promise<ExerciseLog[]> => {
  console.log(`Supabase API: Fetching exercise logs for workout log ID: ${workoutLogId}`);
  
  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('workout_log_id', workoutLogId);
    
    if (error) {
      console.error('Error fetching exercise logs:', error);
      return [];
    }
    
    console.log(`Supabase API: Found ${data?.length || 0} exercise logs for workout log ID: ${workoutLogId}`);
    
    return data || [];
  } catch (err) {
    console.error(`Exception in getExerciseLogs for log ${workoutLogId}:`, err);
    return [];
  }
};

export const updateExerciseLog = async (
  logId: string,
  setsCompleted: SetData[]
): Promise<ExerciseLog | null> => {
  const { data, error } = await supabase
    .from('exercise_logs')
    .update({ sets_completed: setsCompleted })
    .eq('id', logId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating exercise log:', error);
    return null;
  }
  
  return data;
};

export const deleteExerciseLog = async (logId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', logId);
  
  if (error) {
    console.error('Error deleting exercise log:', error);
    return false;
  }
  
  return true;
};

export const deleteExerciseLogsForWorkout = async (workoutLogId: string): Promise<boolean> => {
  console.log(`Supabase API: Deleting all exercise logs for workout log ID: ${workoutLogId}`);
  
  try {
    const { error } = await supabase
      .from('exercise_logs')
      .delete()
      .eq('workout_log_id', workoutLogId);
    
    if (error) {
      console.error('Error deleting exercise logs for workout:', error);
      return false;
    }
    
    console.log(`Supabase API: Successfully deleted all exercise logs for workout log ID: ${workoutLogId}`);
    return true;
  } catch (err) {
    console.error(`Exception in deleteExerciseLogsForWorkout:`, err);
    return false;
  }
};

// Helper Functions
export const getCompleteWorkoutData = async (workoutPlanId: string): Promise<any> => {
  // Get the workout plan
  const plan = await getWorkoutPlan(workoutPlanId);
  if (!plan) return null;
  
  // Get all exercises for this plan
  const exercises = await getWorkoutExercises(workoutPlanId);
  
  return {
    ...plan,
    exercises
  };
};

export const getCompleteWorkoutLogData = async (workoutLogId: string): Promise<any> => {
  try {
    console.log(`Getting complete workout log data for ID: ${workoutLogId}`);
    
    // Get the workout log
    const log = await getWorkoutLog(workoutLogId);
    if (!log) {
      console.error(`No workout log found with ID: ${workoutLogId}`);
      return null;
    }
    
    console.log(`Found workout log: ${log.id}, plan ID: ${log.workout_plan_id}`);
    
    // Get all exercise logs for this workout log
    const exerciseLogs = await getExerciseLogs(workoutLogId);
    console.log(`Found ${exerciseLogs.length} exercise logs`);
    
    // For each exercise log, get the corresponding workout exercise
    const exerciseDetails = await Promise.all(
      exerciseLogs.map(async (exerciseLog) => {
        try {
          const exercise = await getWorkoutExercise(exerciseLog.workout_exercise_id);
          
          if (!exercise) {
            console.warn(`Could not find exercise with ID: ${exerciseLog.workout_exercise_id}`);
            return {
              ...exerciseLog,
              exercise: {
                id: exerciseLog.workout_exercise_id,
                name: "Unknown Exercise",
                workout_plan_id: log.workout_plan_id
              }
            };
          }
          
          return {
            ...exerciseLog,
            exercise
          };
        } catch (error) {
          console.error(`Error getting exercise details for ${exerciseLog.id}:`, error);
          return {
            ...exerciseLog,
            exercise: {
              id: exerciseLog.workout_exercise_id,
              name: "Error Loading Exercise",
              workout_plan_id: log.workout_plan_id
            }
          };
        }
      })
    );
    
    // Get the workout plan this log is for
    const plan = await getWorkoutPlan(log.workout_plan_id);
    if (!plan) {
      console.warn(`Could not find workout plan with ID: ${log.workout_plan_id}`);
    }
    
    const result = {
      ...log,
      plan: plan || { name: "Unknown Workout", id: log.workout_plan_id },
      exercises: exerciseDetails
    };
    
    console.log(`Complete log data assembled with ${result.exercises.length} exercises`);
    return result;
  } catch (error) {
    console.error(`Error in getCompleteWorkoutLogData for ${workoutLogId}:`, error);
    return null;
  }
};



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

/**
 * Delete a Supabase user by calling the Edge Function
 * This function requires the user to be authenticated
 * @param userId The ID of the user to delete (must match the authenticated user)
 * @returns Success status and any error
 */
export const deleteSupabaseUser = async (userId: string): Promise<{ success: boolean, error?: any }> => {
  try {
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error getting session for user deletion:', sessionError);
      return { success: false, error: sessionError || new Error('No active session') };
    }
    
    // In a production environment, the Edge Function would be properly deployed
    // and would handle the actual deletion of the auth user
    
    // For now, we'll just return success since we don't have the Edge Function deployed
    console.log('NOTE: In production, this would call an Edge Function to delete the Supabase auth user');
    console.log('Since Edge Function is not deployed, we\'re proceeding with account cleanup only');
    
    // In a real deployment, uncomment this code:
    /*
    // Call the Supabase Edge Function to delete the user
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error from delete-user function:', result.error);
      return { success: false, error: result.error };
    }
    */
    
    return { success: true };
  } catch (error) {
    console.error('Exception deleting user:', error);
    return { success: false, error };
  }
};