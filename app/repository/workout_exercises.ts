import { supabase } from '@/supabase/supabase';
import { WorkoutExercise } from '@/types';

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