import { supabase } from '@/supabase/supabase';
import { WorkoutPlan } from '@/types';

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