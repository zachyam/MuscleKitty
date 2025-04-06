import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutLog } from '@/types';

const WORKOUTS_KEY = 'muscle_kitty_workouts';
const WORKOUT_LOGS_KEY = 'muscle_kitty_workout_logs';


// TEMPORARY: To generate fake workout data
// REMOVE THIS FUNCTION WHEN NO LONGER NEEDED
export const generateFakeWorkouts = async (userId?: string): Promise<Workout[]> => {
  try {
    // Clear existing workouts to ensure we see our fake data
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify([]));
    // Create a fake workout for reference
    const fakeWorkout = {
      id: "fake-workout-id",
      name: "Demo Workout",
      exercises: [
        { id: "ex1", name: "Push-ups", sets: 3 },
        { id: "ex2", name: "Squats", sets: 3 }
      ],
      createdAt: new Date().toISOString(),
      userId: userId || 'demo-user'  // Use demo-user if no userId provided
    };
    let workouts: Workout[] = [];
    workouts.push(fakeWorkout);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
    return workouts;
  } catch (error) {
    console.error('Error generating fake workouts:', error);
    return [];
  }
};

// Workouts
export const getWorkouts = async (userId?: string): Promise<Workout[]> => {
  try {
    const workoutsJson = await AsyncStorage.getItem(WORKOUTS_KEY);
    const workouts: Workout[] = workoutsJson ? JSON.parse(workoutsJson) : [];
    
    // If userId is provided, filter workouts by that user
    if (userId) {
      return workouts.filter(workout => 
        // Return workouts that either belong to this user or don't have a userId (legacy data)
        workout.userId === userId || !workout.userId
      );
    }
    
    return workouts;
  } catch (error) {
    console.error('Error getting workouts:', error);
    return [];
  }
};

export const getWorkoutById = async (id: string): Promise<Workout | null> => {
  try {
    const workouts = await getWorkouts();
    return workouts.find(workout => workout.id === id) || null;
  } catch (error) {
    console.error('Error getting workout by id:', error);
    return null;
  }
};

export const saveWorkout = async (workout: Workout): Promise<void> => {
  try {
    const workouts = await getWorkouts();
    const existingIndex = workouts.findIndex(w => w.id === workout.id);
    
    if (existingIndex >= 0) {
      workouts[existingIndex] = workout;
    } else {
      workouts.push(workout);
    }
    
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

export const deleteWorkout = async (id: string): Promise<void> => {
  try {
    const workouts = await getWorkouts();
    const updatedWorkouts = workouts.filter(workout => workout.id !== id);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updatedWorkouts));
  } catch (error) {
    console.error('Error deleting workout:', error);
  }
};

// Workout Logs
export const getWorkoutLogs = async (userId?: string): Promise<WorkoutLog[]> => {
  try {
    const logsJson = await AsyncStorage.getItem(WORKOUT_LOGS_KEY);
    const logs: WorkoutLog[] = logsJson ? JSON.parse(logsJson) : [];
    
    // If userId is provided, filter logs by that user
    if (userId) {
      return logs.filter(log => 
        // Return logs that either belong to this user or don't have a userId (legacy data)
        log.userId === userId || !log.userId
      );
    }
    
    return logs;
  } catch (error) {
    console.error('Error getting workout logs:', error);
    return [];
  }
};

export const getWorkoutLogById = async (id: string): Promise<WorkoutLog | null> => {
  try {
    const logs = await getWorkoutLogs();
    return logs.find(log => log.id === id) || null;
  } catch (error) {
    console.error('Error getting workout log by id:', error);
    return null;
  }
};

// Get the most recent workout log for a specific workout
export const getLatestWorkoutLog = async (workoutId: string, userId?: string): Promise<WorkoutLog | null> => {
  try {
    const logs = await getWorkoutLogs(userId);
    
    // Filter logs by workoutId
    const workoutLogs = logs.filter(log => log.workoutId === workoutId);
    
    if (workoutLogs.length === 0) {
      return null;
    }
    
    // Sort by date (newest first)
    workoutLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Return the most recent log
    return workoutLogs[0];
  } catch (error) {
    console.error('Error getting latest workout log:', error);
    return null;
  }
};

export const saveWorkoutLog = async (log: WorkoutLog): Promise<void> => {
  try {
    const logs = await getWorkoutLogs();
    const existingIndex = logs.findIndex(l => l.id === log.id);
    
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving workout log:', error);
  }
};

export const deleteWorkoutLog = async (id: string): Promise<void> => {
  try {
    const logs = await getWorkoutLogs();
    const updatedLogs = logs.filter(log => log.id !== id);
    await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error deleting workout log:', error);
  }
};

// Get workout log history for a specific workout and exercise
export const getExerciseHistory = async (workoutId: string, exerciseId: string, userId?: string, limit = 10): Promise<{date: string, maxWeight: number}[]> => {
  try {
    const logs = await getWorkoutLogs(userId);
    
    // Filter logs by workoutId
    const workoutLogs = logs.filter(log => log.workoutId === workoutId);
    
    if (workoutLogs.length === 0) {
      return [];
    }
    
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
    console.error('Error getting exercise history:', error);
    return [];
  }
};