import { supabase } from '@/supabase/supabase';
import { WorkoutLog } from '@/types';

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

export const getWorkoutLogsWithHistory = async (
  userId: string, 
  workoutPlanId: string,
  limit = 10
): Promise<{
  logs: any[],
  exerciseHistory: {[exerciseId: string]: {date: string, maxWeight: number}[]}
}> => {
  try {
    console.log(`Getting workout logs with history for user ${userId}, workout ${workoutPlanId}`);
    
    // Get all workout logs for this workout
    const { data: logs, error: logsError } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('workout_plan_id', workoutPlanId)
      .order('date_completed', { ascending: false })
      .limit(limit);
    
    if (logsError) {
      console.error('Error fetching workout logs:', logsError);
      return { logs: [], exerciseHistory: {} };
    }
    
    if (!logs || logs.length === 0) {
      return { logs: [], exerciseHistory: {} };
    }
    
    // Get all exercise logs for these workout logs in a single query
    const logIds = logs.map(log => log.id);
    const { data: exerciseLogs, error: exerciseLogsError } = await supabase
      .from('exercise_logs')
      .select(`
        *,
        workout_exercise:workout_exercises(*)
      `)
      .in('workout_log_id', logIds);
    
    if (exerciseLogsError) {
      console.error('Error fetching exercise logs:', exerciseLogsError);
      return { logs: [], exerciseHistory: {} };
    }
    
    // Group exercise logs by workout log
    const exerciseLogsByWorkoutLog: {[logId: string]: any[]} = {};
    exerciseLogs?.forEach(exerciseLog => {
      const logId = exerciseLog.workout_log_id;
      if (!exerciseLogsByWorkoutLog[logId]) {
        exerciseLogsByWorkoutLog[logId] = [];
      }
      exerciseLogsByWorkoutLog[logId].push(exerciseLog);
    });
    
    // Process logs and build exercise history
    const processedLogs = logs.map(log => ({
      ...log,
      exercises: exerciseLogsByWorkoutLog[log.id] || []
    }));
    
    // Build exercise history
    const exerciseHistory: {[exerciseId: string]: {date: string, maxWeight: number}[]} = {};
    
    // Get unique exercise IDs from all logs
    const exerciseIds = new Set<string>();
    processedLogs.forEach(log => {
      log.exercises.forEach((exerciseLog: any) => {
        if (exerciseLog.workout_exercise) {
          exerciseIds.add(exerciseLog.workout_exercise.id);
        }
      });
    });
    
    // Build history for each exercise
    exerciseIds.forEach(exerciseId => {
      const history = processedLogs.map(log => {
        const exerciseLog = log.exercises.find((ex: any) => 
          ex.workout_exercise?.id === exerciseId
        );
        
        if (!exerciseLog || !exerciseLog.sets_completed || !Array.isArray(exerciseLog.sets_completed)) {
          return {
            date: log.date_completed,
            maxWeight: 0
          };
        }
        
        const maxWeight = Math.max(...exerciseLog.sets_completed.map((set: any) => set.weight || 0));
        
        return {
          date: log.date_completed,
          maxWeight
        };
      });
      
      // Reverse to get chronological order (oldest to newest)
      exerciseHistory[exerciseId] = history.reverse();
    });
    
    return { logs: processedLogs, exerciseHistory };
  } catch (error) {
    console.error('Error in getWorkoutLogsWithHistory:', error);
    return { logs: [], exerciseHistory: {} };
  }
};