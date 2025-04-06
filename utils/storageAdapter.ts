// Storage adapter for Supabase
import { 
  Workout, 
  WorkoutLog,
  Exercise,
  SetData,
  ExerciseLogDisplay,
  SetLog
} from '@/types';
import * as SupabaseAPI from './supabase';

// Format workout data from Supabase
const formatWorkoutFromSupabase = async (
  plan: any,
  exercises: any[]
): Promise<Workout> => {
  return {
    id: plan.id,
    name: plan.name,
    exercises: exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.num_target_sets
    })),
    createdAt: plan.created_at,
    userId: plan.user_id
  };
};

// Format workout log from Supabase
const formatWorkoutLogFromSupabase = async (
  log: any // The combined workout log with plan and exercises
): Promise<WorkoutLog> => {
  console.log('Formatting workout log:', JSON.stringify(log, null, 2));
  
  // Fetch the workout plan name
  const workoutPlan = log.plan;
  
  // Check if we have exercise data
  if (!log.exercises || log.exercises.length === 0) {
    console.warn('No exercises found in workout log');
    return {
      id: log.id,
      workoutId: log.workout_plan_id,
      workoutName: workoutPlan?.name || 'Unknown Workout',
      exercises: [],
      date: log.date_completed,
      userId: log.user_id
    };
  }
  
  // Format exercises
  const exercises = log.exercises.map((exerciseLog: any) => {
    const exercise = exerciseLog.exercise;
    
    // Handle missing exercise data
    if (!exercise) {
      console.warn('Missing exercise data in log:', exerciseLog);
      return {
        exerciseId: exerciseLog.workout_exercise_id || 'unknown',
        exerciseName: 'Unknown Exercise',
        sets: []
      };
    }
    
    // Handle missing or malformed sets_completed
    if (!exerciseLog.sets_completed || !Array.isArray(exerciseLog.sets_completed)) {
      console.warn('Missing or invalid sets_completed for exercise:', exercise.name);
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: []
      };
    }
    
    // Format sets
    const sets = exerciseLog.sets_completed.map((set: SetData, index: number) => ({
      setNumber: index + 1,
      reps: set.reps || 0,
      weight: set.weight || 0
    }));
    
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets
    };
  });
  
  // Create formatted workout log
  const result = {
    id: log.id,
    workoutId: log.workout_plan_id,
    workoutName: workoutPlan?.name || 'Unknown Workout',
    exercises,
    date: log.date_completed,
    userId: log.user_id
  };
  
  console.log('Formatted workout log:', JSON.stringify(result, null, 2));
  return result;
};

// Workout functions
export const getWorkouts = async (userId?: string): Promise<Workout[]> => {
  if (!userId) return [];
  
  try {
    // Get all workout plans for this user
    const plans = await SupabaseAPI.getWorkoutPlans(userId);
    
    // For each plan, get the exercises and format them
    const workouts = await Promise.all(
      plans.map(async (plan) => {
        const exercises = await SupabaseAPI.getWorkoutExercises(plan.id);
        return formatWorkoutFromSupabase(plan, exercises);
      })
    );
    
    return workouts;
  } catch (error) {
    console.error('Error getting workouts from Supabase:', error);
    return [];
  }
};

export const getWorkoutById = async (id: string): Promise<Workout | null> => {
  try {
    // Get the workout plan
    const plan = await SupabaseAPI.getWorkoutPlan(id);
    if (!plan) return null;
    
    // Get the exercises for this plan
    const exercises = await SupabaseAPI.getWorkoutExercises(id);
    
    // Format the data
    return formatWorkoutFromSupabase(plan, exercises);
  } catch (error) {
    console.error('Error getting workout by id from Supabase:', error);
    return null;
  }
};

export const saveWorkout = async (workout: Workout): Promise<void> => {
  try {
    if (!workout.userId) {
      console.error('Cannot save workout without userId');
      return;
    }
    
    // Check if workout already exists, but only if ID is provided
    let existingPlan = null;
    if (workout.id && workout.id !== '') {
      existingPlan = await SupabaseAPI.getWorkoutPlan(workout.id);
    }
    
    console.log(`StorageAdapter: Workout ID: "${workout.id}", existingPlan: ${existingPlan ? 'found' : 'not found'}`); 
    
    if (existingPlan) {
      // Update existing workout
      await SupabaseAPI.updateWorkoutPlan(workout.id, workout.name);
      
      // Get existing exercises to compare
      const existingExercises = await SupabaseAPI.getWorkoutExercises(workout.id);
      
      // Create a map of existing exercises by name
      const existingExerciseMap = new Map(
        existingExercises.map(ex => [ex.name, ex])
      );
      
      // For each exercise in the workout, update or create
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        const existingExercise = existingExerciseMap.get(exercise.name);
        
        if (existingExercise) {
          // Update existing exercise
          await SupabaseAPI.updateWorkoutExercise(existingExercise.id, {
            name: exercise.name,
            num_target_sets: exercise.sets || 1,
            order: i
          });
          // Remove from map to track which ones are no longer needed
          existingExerciseMap.delete(exercise.name);
        } else {
          // Create new exercise
          await SupabaseAPI.addExerciseToWorkout(
            workout.id,
            exercise.name,
            exercise.sets || 1,
            i
          );
        }
      }
      
      // Delete any exercises that are no longer in the workout
      for (const [_, exercise] of existingExerciseMap.entries()) {
        await SupabaseAPI.deleteWorkoutExercise(exercise.id);
      }
    } else {
      // Create new workout - let Supabase generate the UUID
      const newPlan = await SupabaseAPI.createWorkoutPlan(workout.userId, workout.name);
      
      if (newPlan) {
        // Add exercises to the workout
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          await SupabaseAPI.addExerciseToWorkout(
            newPlan.id,
            exercise.name,
            exercise.sets || 1,
            i
          );
        }
      }
    }
  } catch (error) {
    console.error('Error saving workout to Supabase:', error);
  }
};

export const deleteWorkout = async (id: string): Promise<void> => {
  try {
    console.log(`StorageAdapter: Deleting workout plan with ID: ${id}`);
    
    // Delete the workout plan - Supabase foreign key constraints will cascade delete
    // all related exercises automatically
    const result = await SupabaseAPI.deleteWorkoutPlan(id);
    
    if (result) {
      console.log(`StorageAdapter: Successfully deleted workout plan with ID: ${id}`);
    } else {
      console.error(`StorageAdapter: Failed to delete workout plan with ID: ${id}`);
    }
  } catch (error) {
    console.error('Error deleting workout from Supabase:', error);
    throw error; // Re-throw to allow the UI to show an error message
  }
};

// Workout Log functions
export const getWorkoutLogs = async (userId?: string): Promise<WorkoutLog[]> => {
  if (!userId) return [];
  
  try {
    // Get all workout logs for this user
    const logs = await SupabaseAPI.getWorkoutLogs(userId);
    
    // Format each log
    const workoutLogs = await Promise.all(
      logs.map(async (log) => {
        // Get complete log data with exercises
        const completeLog = await SupabaseAPI.getCompleteWorkoutLogData(log.id);
        return await formatWorkoutLogFromSupabase(completeLog);
      })
    );
    
    return workoutLogs;
  } catch (error) {
    console.error('Error getting workout logs from Supabase:', error);
    return [];
  }
};

export const getWorkoutLogById = async (id: string): Promise<WorkoutLog | null> => {
  console.log(`StorageAdapter: Getting workout log by ID: ${id}`);
  
  try {
    // Get complete log data with exercises
    const log = await SupabaseAPI.getCompleteWorkoutLogData(id);
    
    if (!log) {
      console.error(`StorageAdapter: No log data returned for ID: ${id}`);
      return null;
    }
    
    console.log(`StorageAdapter: Successfully retrieved log data for ID: ${id}`);
    
    // Format the log data
    const formattedLog = await formatWorkoutLogFromSupabase(log);
    
    if (!formattedLog.exercises || formattedLog.exercises.length === 0) {
      console.warn(`StorageAdapter: Warning - No exercises in formatted log for ID: ${id}`);
    } else {
      console.log(`StorageAdapter: Formatted log has ${formattedLog.exercises.length} exercises`);
    }
    
    return formattedLog;
  } catch (error) {
    console.error('StorageAdapter: Error getting workout log by id from Supabase:', error);
    return null;
  }
};

export const getLatestWorkoutLog = async (workoutId: string, userId?: string): Promise<WorkoutLog | null> => {
  if (!userId) return null;
  
  try {
    // Get logs for this workout, sorted by date
    const logs = await SupabaseAPI.getWorkoutLogs(userId, workoutId);
    
    if (logs.length === 0) return null;
    
    // Sort by date (newest first)
    logs.sort((a, b) => 
      new Date(b.date_completed).getTime() - new Date(a.date_completed).getTime()
    );
    
    // Get complete data for the most recent log
    const completeLog = await SupabaseAPI.getCompleteWorkoutLogData(logs[0].id);
    
    // Format the log data
    return await formatWorkoutLogFromSupabase(completeLog);
  } catch (error) {
    console.error('Error getting latest workout log from Supabase:', error);
    return null;
  }
};

export const saveWorkoutLog = async (log: WorkoutLog): Promise<string | null> => {
  try {
    if (!log.userId) {
      throw new Error('Cannot save workout log without userId');
    }
    
    console.log(`Saving workout log: userId=${log.userId}, workoutId=${log.workoutId}, exercises=${log.exercises.length}`);
    if (log.id) console.log(`Log ID: ${log.id}`);
    
    // Check if we're updating an existing log or creating a new one
    let workoutLog;
    let isUpdate = false;
    
    if (log.id && log.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        // First, check if this log already exists
        const existingLog = await SupabaseAPI.checkIfLogExists(log.id);
        
        if (existingLog) {
          // This is an update to an existing log
          console.log(`Updating existing workout log with ID: ${log.id}`);
          isUpdate = true;
          
          // Delete all exercise logs associated with this workout log
          await SupabaseAPI.deleteExerciseLogsForWorkout(log.id);
          
          // Workoutlog ID to use
          workoutLog = { id: log.id };
        }
      } catch (err) {
        console.error('Error checking if log exists:', err);
        // If there's an error checking the ID, we'll just create a new log
      }
    }
    
    // If not an update, create a new workout log
    if (!isUpdate) {
      console.log(`Creating new workout log`);
      workoutLog = await SupabaseAPI.createWorkoutLog(
        log.workoutId,
        log.userId,
        'Completed workout'
      );
      
      if (!workoutLog) {
        throw new Error('Failed to create workout log');
      }
      
      console.log(`Created workout log with server ID: ${workoutLog.id}`);
    }
    
    // Process each exercise log with its sets
    for (const exerciseLog of log.exercises) {
      // Skip exercises with no completed sets (reps > 0)
      const hasCompletedSets = exerciseLog.sets.some(set => set.reps > 0);
      if (!hasCompletedSets) {
        console.log(`Skipping exercise ${exerciseLog.exerciseName} with no completed sets`);
        continue;
      }
      
      // Format set data for Supabase
      const setsCompleted = exerciseLog.sets
        .filter(set => set.reps > 0) // Only include completed sets
        .map(set => ({
          reps: set.reps,
          weight: set.weight
        }));
      
      console.log(`Logging exercise ${exerciseLog.exerciseName} with ${setsCompleted.length} sets`);
      
      // Make sure we have a valid exercise ID
      if (!exerciseLog.exerciseId) {
        console.error(`Missing exerciseId for exercise "${exerciseLog.exerciseName}"`);
        continue;
      }
      
      // Save the exercise log with sets - always use the server-generated log ID
      const result = await SupabaseAPI.logExercise(
        workoutLog.id,
        exerciseLog.exerciseId,
        setsCompleted
      );
      
      if (!result) {
        console.error(`Failed to log exercise ${exerciseLog.exerciseName}`);
      }
    }
    
    console.log(`Successfully ${isUpdate ? 'updated' : 'saved'} workout log with exercises`);
    
    // Return the server-generated ID so the client can update its state
    return workoutLog.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error saving workout log to Supabase:', errorMessage);
    throw error; // Re-throw to allow handleFinishWorkout to catch and display it
  }
};

export const deleteWorkoutLog = async (id: string): Promise<void> => {
  try {
    await SupabaseAPI.deleteWorkoutLog(id);
  } catch (error) {
    console.error('Error deleting workout log from Supabase:', error);
  }
};

// Exercise History
export const getExerciseHistory = async (
  workoutId: string, 
  exerciseId: string, 
  userId?: string, 
  limit = 10
): Promise<{date: string, maxWeight: number}[]> => {
  if (!userId) return [];
  
  try {
    // Get all logs for this workout
    const logs = await SupabaseAPI.getWorkoutLogs(userId, workoutId);
    
    // Get full log data for each log
    const fullLogs = await Promise.all(
      logs.map(log => SupabaseAPI.getCompleteWorkoutLogData(log.id))
    );
    
    // Format the logs
    const workoutLogs = await Promise.all(
      fullLogs.map(log => formatWorkoutLogFromSupabase(log))
    );
    
    // Sort by date (newest first)
    workoutLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Limit to requested number of logs
    const limitedLogs = workoutLogs.slice(0, limit);
    
    // Extract max weight for the specific exercise from each log
    const history = limitedLogs.map(log => {
      const exerciseLog = log.exercises.find(ex => ex.exerciseId === exerciseId);
      
      // If exercise not found or no sets, return 0 as max weight
      if (!exerciseLog || !exerciseLog.sets || exerciseLog.sets.length === 0) {
        return {
          date: log.date,
          maxWeight: 0
        };
      }
      
      // Find max weight among all sets
      const maxWeight = Math.max(...exerciseLog.sets.map(set => set.weight));
      
      return {
        date: log.date,
        maxWeight
      };
    });
    
    // Reverse to get chronological order (oldest to newest)
    return history.reverse();
  } catch (error) {
    console.error('Error getting exercise history from Supabase:', error);
    return [];
  }
};

