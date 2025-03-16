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
  const level = Math.floor(Math.sqrt(xp / 10));
  return Math.max(1, level); // Minimum level is 1
};

/**
 * Calculate the XP needed to reach the next level from current level
 */
export const calculateNextLevelXP = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 10;
  const xpForPreviousLevel = currentLevel > 1 ? Math.pow(currentLevel - 1, 2) * 10 : 0;
  const totalXpNeeded = xpForNextLevel - xpForPreviousLevel;
  return totalXpNeeded;
};

/**
 * Calculate how much XP the user has accumulated in the current level
 */
export const calculateCurrentLevelXP = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  
  // Get XP thresholds for current and previous levels
  const xpForCurrentLevel = Math.pow(currentLevel, 2) * 10;
  const xpForPreviousLevel = currentLevel > 1 ? Math.pow(currentLevel - 1, 2) * 10 : 0;
  
  // Calculate how much XP the user has gained in the current level
  return Math.max(0, xp - xpForPreviousLevel);
};

/**
 * Calculate the progress percentage (0-100) towards the next level
 */
export const calculateLevelProgress = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  
  // Get XP thresholds for current and next levels
  const xpForCurrentLevel = Math.pow(currentLevel, 2) * 10;
  const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 10;
  const xpForPreviousLevel = currentLevel > 1 ? Math.pow(currentLevel - 1, 2) * 10 : 0;
  
  // Total XP needed to progress from previous level to next level
  const totalXpForNextLevel = xpForNextLevel - xpForPreviousLevel;
  
  // How much XP the user has gained since previous level
  const currentLevelProgress = xp - xpForPreviousLevel;
  
  // Calculate progress percentage
  const progress = (currentLevelProgress / totalXpForNextLevel) * 100;
  
  return Math.max(0, Math.min(100, progress));
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