// Unified Database & UI Models
export type SetData = {
  reps: number;
  weight: number;
};

export type SetLog = {
  setNumber: number;
  reps: number;
  weight: number;
};

// Exercise in a workout plan
export type Exercise = {
  id: string;
  name: string;
  sets?: number;
};

// Complete workout plan
export type Workout = {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string; 
  userId: string;
};

// Exercise completed during a workout
export type ExerciseLogDisplay = {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
};

// Complete log of a finished workout
export type WorkoutLog = {
  id?: string;  // Made optional to allow creating logs without an ID (Supabase will generate one)
  workoutId: string;
  workoutName: string;
  exercises: ExerciseLogDisplay[];
  date: string;
  userId: string;
};

export type User = {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  hasCompletedOnboarding?: boolean;
  kittyName?: string;
  kittyBreedId?: string;
  coins?: number;
  xp?: number;
  level?: number;
};

export type AuthResponse = {
  user: User;
  token: string;
  error?: string;
};

export type KittyProfile = {
  id: string;
  breed: string;
  image: any; // Used for display in the adoption screen
  imageUri: any; // Used for saving to user profile
  personality: string;
  favoriteExercise: string;
  favoriteFood: string;
};
