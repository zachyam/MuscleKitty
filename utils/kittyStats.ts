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
export const calculateLevel = (currentLevel: number, xp: number): number => {
  const nextLevelXP = calculateNextLevelXP(currentLevel, xp);
  if (xp >= nextLevelXP) {
    return currentLevel + 1;
  }
  return currentLevel;
};

/**
 * Calculate the XP needed to reach the next level from current level
 */
export const calculateNextLevelXP = (currentLevel: number, xp: number): number => {
  return Math.pow(currentLevel + 1, 2) * 10;
};

/**
 * Calculate how much XP the user has accumulated in the current level
 */
export const calculateCurrentLevelXP = (currentLevel: number, xp: number): number => {
  const nextLevelXP = calculateNextLevelXP(currentLevel, xp);
  if (xp >= nextLevelXP) {
    return xp - nextLevelXP;
  }
  return xp;
};

/**
 * Calculate the progress percentage (0-100) towards the next level
 */
export const calculateLevelProgress = (currentLevel: number, xp: number): number => {
  return calculateCurrentLevelXP(currentLevel, xp) / calculateNextLevelXP(currentLevel, xp) * 100
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