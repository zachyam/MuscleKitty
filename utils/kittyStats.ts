/**
 * Kitty Stats Utility
 * 
 * A utility module for consistent calculations of Kitty stats (XP, level, coins)
 * across the application.
 */

/**
 * Calculate level based on XP
 * Uses an exponential curve: level = Math.floor(Math.sqrt(xp / 10))
 * This makes higher levels progressively harder to reach
 */
export const calculateLevel = (xp: number): number => {
  return  Math.floor(Math.sqrt(xp / 10));
};

/**
 * Calculate how much XP the user has accumulated in the current level
 */
export const calculateCurrentLevelXP = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 10;
};

/**
 * Calculate the progress percentage (0-100) towards the next level
 */
export const calculateLevelProgress = (currentLevel: number, currentXP: number): number => {
  return calculateCurrentLevelDisplayXP(currentLevel, currentXP) / calculateTotalLevelDisplayXP(currentLevel) * 100
};

export const calculateCurrentLevelDisplayXP = (currentLevel: number, currentXP: number): number => {
  const currentLevelXP = calculateCurrentLevelXP(currentLevel);
  return currentXP - currentLevelXP;
};

export const calculateTotalLevelDisplayXP = (currentLevel: number): number => {
  const nextLevelXP = calculateCurrentLevelXP(currentLevel + 1);
  const currentLevelXP = calculateCurrentLevelXP(currentLevel);
  return nextLevelXP - currentLevelXP;
};

/**
 * Returns the total XP required to reach a specific level
 */
export const calculateXPForLevel = (level: number): number => {
  return Math.pow(level, 2) * 10;
};

/**
 * Calculate the XP remaining to reach the next level
 */
export const calculateRemainingXP = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 10;
  return Math.max(0, xpForNextLevel - xp);
};

/**
 * Calculate coin rewards based on workout difficulty and duration
 * This is just a placeholder implementation and can be adjusted as needed
 */
export const calculateWorkoutCoins = (
  difficulty: 'easy' | 'medium' | 'hard', 
  durationMinutes: number
): number => {
  const difficultyMultiplier = {
    'easy': 1,
    'medium': 1.5,
    'hard': 2
  };
  
  // Base calculation: 5 coins per 10 minutes, scaled by difficulty
  return Math.round(5 * (durationMinutes / 10) * difficultyMultiplier[difficulty]);
};

/**
 * Calculate XP rewards based on workout difficulty and duration
 * This is just a placeholder implementation and can be adjusted as needed
 */
export const calculateWorkoutXP = (
  difficulty: 'easy' | 'medium' | 'hard', 
  durationMinutes: number
): number => {
  const difficultyMultiplier = {
    'easy': 1,
    'medium': 2,
    'hard': 3
  };
  
  // Base calculation: 10 XP per 10 minutes, scaled by difficulty
  return Math.round(10 * (durationMinutes / 10) * difficultyMultiplier[difficulty]);
};