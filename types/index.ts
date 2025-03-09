export type Exercise = {
  id: string;
  name: string;
  sets?: number;
};

export type Workout = {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
  userId: string;
};

export type SetLog = {
  setNumber: number;
  reps: number;
  weight: number;
};

export type ExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
};

export type WorkoutLog = {
  id: string;
  workoutId: string;
  workoutName: string;
  exercises: ExerciseLog[];
  date: string;
  userId: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  hasCompletedOnboarding?: boolean;
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
