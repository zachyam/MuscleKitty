import { supabase } from '@/supabase/supabase';
import { ExerciseLog, SetData } from '@/types';

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