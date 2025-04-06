-- Create workout_plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  num_target_sets INTEGER NOT NULL DEFAULT 3,
  "order" INTEGER NOT NULL
);

-- Create workout_logs table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_completed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create exercise_logs table
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  sets_completed JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_plan_id ON workout_exercises(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_plan_id ON workout_logs(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_log_id ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_exercise_id ON exercise_logs(workout_exercise_id);

-- Create Row Level Security (RLS) policies
-- Workout Plans: users can only see, edit, and delete their own workout plans
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY workout_plans_select_policy ON workout_plans 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY workout_plans_insert_policy ON workout_plans 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY workout_plans_update_policy ON workout_plans 
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY workout_plans_delete_policy ON workout_plans 
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Exercises: users can only see, edit, and delete exercises in their own workout plans
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY workout_exercises_select_policy ON workout_exercises 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_exercises.workout_plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );
  
CREATE POLICY workout_exercises_insert_policy ON workout_exercises 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_exercises.workout_plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );
  
CREATE POLICY workout_exercises_update_policy ON workout_exercises 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_exercises.workout_plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );
  
CREATE POLICY workout_exercises_delete_policy ON workout_exercises 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_exercises.workout_plan_id
      AND workout_plans.user_id = auth.uid()
    )
  );

-- Workout Logs: users can only see, edit, and delete their own workout logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY workout_logs_select_policy ON workout_logs 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY workout_logs_insert_policy ON workout_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY workout_logs_update_policy ON workout_logs 
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY workout_logs_delete_policy ON workout_logs 
  FOR DELETE USING (auth.uid() = user_id);

-- Exercise Logs: users can only see, edit, and delete exercise logs in their own workout logs
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercise_logs_select_policy ON exercise_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );
  
CREATE POLICY exercise_logs_insert_policy ON exercise_logs 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );
  
CREATE POLICY exercise_logs_update_policy ON exercise_logs 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );
  
CREATE POLICY exercise_logs_delete_policy ON exercise_logs 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );