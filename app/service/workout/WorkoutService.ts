import { WorkoutPlan, WorkoutExercise, WorkoutLog, ExerciseLog, SetData, Workout } from '@/types';
import * as WorkoutPlanRepository from '@/app/repository/workout_plans';
import * as WorkoutExerciseRepository from '@/app/repository/workout_exercises';
import * as WorkoutLogRepository from '@/app/repository/workout_logs';
import * as ExerciseLogRepository from '@/app/repository/exercise_logs';

export class WorkoutService {
  // Workout Plan operations
  static async getWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return WorkoutPlanRepository.getWorkoutPlans(userId);
  }

  static async getWorkoutPlan(planId: string): Promise<WorkoutPlan | null> {
    return WorkoutPlanRepository.getWorkoutPlan(planId);
  }

  static async createWorkoutPlan(userId: string, name: string): Promise<WorkoutPlan | null> {
    return WorkoutPlanRepository.createWorkoutPlan(userId, name);
  }

  static async updateWorkoutPlan(planId: string, name: string): Promise<WorkoutPlan | null> {
    return WorkoutPlanRepository.updateWorkoutPlan(planId, name);
  }

  static async deleteWorkoutPlan(planId: string): Promise<boolean> {
    return WorkoutPlanRepository.deleteWorkoutPlan(planId);
  }

  // Workout Exercise operations
  static async getWorkoutExercises(workoutPlanId: string): Promise<WorkoutExercise[]> {
    return WorkoutExerciseRepository.getWorkoutExercises(workoutPlanId);
  }

  static async getWorkoutExercise(exerciseId: string): Promise<WorkoutExercise | null> {
    return WorkoutExerciseRepository.getWorkoutExercise(exerciseId);
  }

  static async addExerciseToWorkout(
    workoutPlanId: string,
    name: string,
    numTargetSets: number,
    order: number
  ): Promise<WorkoutExercise | null> {
    return WorkoutExerciseRepository.addExerciseToWorkout(workoutPlanId, name, numTargetSets, order);
  }

  static async updateWorkoutExercise(
    exerciseId: string,
    updates: Partial<WorkoutExercise>
  ): Promise<WorkoutExercise | null> {
    return WorkoutExerciseRepository.updateWorkoutExercise(exerciseId, updates);
  }

  static async deleteWorkoutExercise(exerciseId: string): Promise<boolean> {
    return WorkoutExerciseRepository.deleteWorkoutExercise(exerciseId);
  }

  // Workout Log operations
  static async createWorkoutLog(
    workoutPlanId: string,
    userId: string,
    notes?: string
  ): Promise<WorkoutLog | null> {
    return WorkoutLogRepository.createWorkoutLog(workoutPlanId, userId, notes);
  }

  static async getWorkoutLog(logId: string): Promise<WorkoutLog | null> {
    return WorkoutLogRepository.getWorkoutLog(logId);
  }

  static async getWorkoutLogs(userId: string, workoutPlanId?: string): Promise<WorkoutLog[]> {
    return WorkoutLogRepository.getWorkoutLogs(userId, workoutPlanId);
  }

  static async updateWorkoutLog(logId: string, updates: Partial<WorkoutLog>): Promise<WorkoutLog | null> {
    return WorkoutLogRepository.updateWorkoutLog(logId, updates);
  }

  static async deleteWorkoutLog(logId: string): Promise<boolean> {
    return WorkoutLogRepository.deleteWorkoutLog(logId);
  }

  static async checkIfLogExists(logId: string): Promise<boolean> {
    return WorkoutLogRepository.checkIfLogExists(logId);
  }

  // Exercise Log operations
  static async logExercise(
    workoutLogId: string,
    workoutExerciseId: string,
    setsCompleted: SetData[]
  ): Promise<ExerciseLog | null> {
    return ExerciseLogRepository.logExercise(workoutLogId, workoutExerciseId, setsCompleted);
  }

  static async getExerciseLog(logId: string): Promise<ExerciseLog | null> {
    return ExerciseLogRepository.getExerciseLog(logId);
  }

  static async getExerciseLogs(workoutLogId: string): Promise<ExerciseLog[]> {
    return ExerciseLogRepository.getExerciseLogs(workoutLogId);
  }

  static async updateExerciseLog(logId: string, setsCompleted: SetData[]): Promise<ExerciseLog | null> {
    return ExerciseLogRepository.updateExerciseLog(logId, setsCompleted);
  }

  static async deleteExerciseLog(logId: string): Promise<boolean> {
    return ExerciseLogRepository.deleteExerciseLog(logId);
  }

  static async deleteExerciseLogsForWorkout(workoutLogId: string): Promise<boolean> {
    return ExerciseLogRepository.deleteExerciseLogsForWorkout(workoutLogId);
  }

  // Helper methods
  static async getCompleteWorkoutData(workoutPlanId: string): Promise<any> {
    const plan = await this.getWorkoutPlan(workoutPlanId);
    if (!plan) return null;

    const exercises = await this.getWorkoutExercises(workoutPlanId);

    return {
      ...plan,
      exercises
    };
  }

  static async getCompleteWorkoutLogData(workoutLogId: string): Promise<any> {
    try {
      console.log(`Getting complete workout log data for ID: ${workoutLogId}`);

      const log = await this.getWorkoutLog(workoutLogId);
      if (!log) {
        console.error(`No workout log found with ID: ${workoutLogId}`);
        return null;
      }

      console.log(`Found workout log: ${log.id}, plan ID: ${log.workout_plan_id}`);

      const exerciseLogs = await this.getExerciseLogs(workoutLogId);
      console.log(`Found ${exerciseLogs.length} exercise logs`);

      const exerciseDetails = await Promise.all(
        exerciseLogs.map(async (exerciseLog) => {
          try {
            const exercise = await this.getWorkoutExercise(exerciseLog.workout_exercise_id);

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

      const plan = await this.getWorkoutPlan(log.workout_plan_id);
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
  }

  static async getWorkoutLogsWithHistory(
    userId: string,
    workoutPlanId: string,
    limit = 10
  ): Promise<{
    logs: any[],
    exerciseHistory: { [exerciseId: string]: { date: string, maxWeight: number }[] }
  }> {
    return WorkoutLogRepository.getWorkoutLogsWithHistory(userId, workoutPlanId, limit);
  }

  // Formatting methods for UI display
  static async formatWorkoutFromSupabase(
    plan: any,
    exercises: any[]
  ): Promise<Workout> {
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
  }

  static async formatWorkoutLogFromSupabase(
    log: any // The combined workout log with plan and exercises
  ): Promise<WorkoutLog> {
    
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
    
    return result;
  }

  // High-level workout operations with formatting
  static async getFormattedWorkouts(userId?: string): Promise<Workout[]> {
    if (!userId) return [];
    
    try {
      // Get all workout plans for this user
      const plans = await this.getWorkoutPlans(userId);
      
      // For each plan, get the exercises and format them
      const workouts = await Promise.all(
        plans.map(async (plan) => {
          const exercises = await this.getWorkoutExercises(plan.id);
          return this.formatWorkoutFromSupabase(plan, exercises);
        })
      );
      
      return workouts;
    } catch (error) {
      console.error('Error getting formatted workouts from Supabase:', error);
      return [];
    }
  }

  static async getFormattedWorkoutById(id: string): Promise<Workout | null> {
    try {
      // Get the workout plan
      const plan = await this.getWorkoutPlan(id);
      if (!plan) return null;
      
      // Get the exercises for this plan
      const exercises = await this.getWorkoutExercises(id);
      
      // Format the data
      return this.formatWorkoutFromSupabase(plan, exercises);
    } catch (error) {
      console.error('Error getting formatted workout by id from Supabase:', error);
      return null;
    }
  }

  static async saveFormattedWorkout(workout: Workout): Promise<void> {
    try {
      if (!workout.userId) {
        console.error('Cannot save workout without userId');
        return;
      }
      
      // Check if workout already exists, but only if ID is provided
      let existingPlan = null;
      if (workout.id && workout.id !== '') {
        existingPlan = await this.getWorkoutPlan(workout.id);
      }
      
      console.log(`WorkoutService: Workout ID: "${workout.id}", existingPlan: ${existingPlan ? 'found' : 'not found'}`); 
      
      if (existingPlan) {
        // Update existing workout
        await this.updateWorkoutPlan(workout.id, workout.name);
        
        // Get existing exercises to compare
        const existingExercises = await this.getWorkoutExercises(workout.id);
        
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
            await this.updateWorkoutExercise(existingExercise.id, {
              name: exercise.name,
              num_target_sets: exercise.sets || 1,
              order: i
            });
            // Remove from map to track which ones are no longer needed
            existingExerciseMap.delete(exercise.name);
          } else {
            // Create new exercise
            await this.addExerciseToWorkout(
              workout.id,
              exercise.name,
              exercise.sets || 1,
              i
            );
          }
        }
        
        // Delete any exercises that are no longer in the workout
        for (const [_, exercise] of existingExerciseMap.entries()) {
          await this.deleteWorkoutExercise(exercise.id);
        }
      } else {
        // Create new workout - let Supabase generate the UUID
        const newPlan = await this.createWorkoutPlan(workout.userId, workout.name);
        
        if (newPlan) {
          // Add exercises to the workout
          for (let i = 0; i < workout.exercises.length; i++) {
            const exercise = workout.exercises[i];
            await this.addExerciseToWorkout(
              newPlan.id,
              exercise.name,
              exercise.sets || 1,
              i
            );
          }
        }
      }
    } catch (error) {
      console.error('Error saving formatted workout to Supabase:', error);
    }
  }

  static async getFormattedWorkoutLogs(userId?: string): Promise<WorkoutLog[]> {
    if (!userId) return [];
    
    try {
      // Get all workout logs for this user
      const logs = await this.getWorkoutLogs(userId);
      
      // Format each log
      const workoutLogs = await Promise.all(
        logs.map(async (log) => {
          // Get complete log data with exercises
          const completeLog = await this.getCompleteWorkoutLogData(log.id);
          return await this.formatWorkoutLogFromSupabase(completeLog);
        })
      );
      
      return workoutLogs;
    } catch (error) {
      console.error('Error getting formatted workout logs from Supabase:', error);
      return [];
    }
  }

  static async getFormattedWorkoutLogById(id: string): Promise<WorkoutLog | null> {
    console.log(`WorkoutService: Getting formatted workout log by ID: ${id}`);
    
    try {
      // Get complete log data with exercises
      const log = await this.getCompleteWorkoutLogData(id);
      
      if (!log) {
        console.error(`WorkoutService: No log data returned for ID: ${id}`);
        return null;
      }
      
      console.log(`WorkoutService: Successfully retrieved log data for ID: ${id}`);
      
      // Format the log data
      const formattedLog = await this.formatWorkoutLogFromSupabase(log);
      
      if (!formattedLog.exercises || formattedLog.exercises.length === 0) {
        console.warn(`WorkoutService: Warning - No exercises in formatted log for ID: ${id}`);
      } else {
        console.log(`WorkoutService: Formatted log has ${formattedLog.exercises.length} exercises`);
      }
      
      return formattedLog;
    } catch (error) {
      console.error('WorkoutService: Error getting formatted workout log by id from Supabase:', error);
      return null;
    }
  }

  static async getFormattedLatestWorkoutLog(workoutId: string, userId?: string): Promise<WorkoutLog | null> {
    if (!userId) return null;
    
    try {
      // Get logs for this workout, sorted by date
      const logs = await this.getWorkoutLogs(userId, workoutId);
      
      if (logs.length === 0) return null;
      
      // Sort by date (newest first)
      logs.sort((a, b) => 
        new Date(b.date_completed).getTime() - new Date(a.date_completed).getTime()
      );
      
      // Get complete data for the most recent log
      const completeLog = await this.getCompleteWorkoutLogData(logs[0].id);
      
      // Format the log data
      return await this.formatWorkoutLogFromSupabase(completeLog);
    } catch (error) {
      console.error('Error getting formatted latest workout log from Supabase:', error);
      return null;
    }
  }

  static async saveFormattedWorkoutLog(log: WorkoutLog): Promise<string | null> {
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
          const existingLog = await this.checkIfLogExists(log.id);
          
          if (existingLog) {
            // This is an update to an existing log
            console.log(`Updating existing workout log with ID: ${log.id}`);
            isUpdate = true;
            
            // Delete all exercise logs associated with this workout log
            await this.deleteExerciseLogsForWorkout(log.id);
            
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
        workoutLog = await this.createWorkoutLog(
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
        const result = await this.logExercise(
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
      console.error('Error saving formatted workout log to Supabase:', errorMessage);
      throw error; // Re-throw to allow handleFinishWorkout to catch and display it
    }
  }

  static async getFormattedExerciseHistory(
    workoutId: string, 
    exerciseId: string, 
    userId?: string, 
    limit = 10
  ): Promise<{date: string, maxWeight: number}[]> {
    if (!userId) return [];
    
    try {
      // Get all logs for this workout
      const logs = await this.getWorkoutLogs(userId, workoutId);
      
      // Get full log data for each log
      const fullLogs = await Promise.all(
        logs.map(log => this.getCompleteWorkoutLogData(log.id))
      );
      
      // Format the logs
      const workoutLogs = await Promise.all(
        fullLogs.map(log => this.formatWorkoutLogFromSupabase(log))
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
      console.error('Error getting formatted exercise history from Supabase:', error);
      return [];
    }
  }
}