import { User } from '@/types';
import { getWorkoutLogs } from '@/utils/storage';

export const loadWorkoutLogs = async (
  user: User | null, 
  setWorkoutLogs: (logs: any[]) => void,
  setWorkoutStats: (stats: { thisMonth: number, total: number }) => void
) => {
  if (user?.id) {
    try {
      // TEMPORARY: Generate fake data for demo purposes - REMOVE THIS LATER
      const { generateFakeWorkoutLogs } = await import('@/utils/storage');
      await generateFakeWorkoutLogs(user.id);
      
      // Get logs AFTER generating fake data
      const logs = await getWorkoutLogs(user.id);
      console.log(`Loaded ${logs.length} workout logs for user ${user.id}`);
      
      setWorkoutLogs(logs);
      
      // Calculate stats based on loaded logs
      const total = logs.length;
      
      // Calculate workouts this month
      const now = new Date();
      const thisMonth = logs.filter((log: any) => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === now.getMonth() && 
               logDate.getFullYear() === now.getFullYear();
      }).length;
      
      setWorkoutStats({
        thisMonth,
        total
      });
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
  }
};

export const refreshAvatar = async (
  user: User | null,
  setUser?: (user: User | null) => void
) => {
  if (user) {
    try {
      // Import the loadUserKittyData function
      const { loadUserKittyData } = await import('@/utils/auth');
      
      // Load the kitty data (avatar and name)
      const updatedUser = await loadUserKittyData(user);
      
      // Only update if the user data has changed and setUser is provided
      if ((updatedUser.avatarUrl !== user.avatarUrl || 
           updatedUser.kittyName !== user.kittyName) && setUser) {
        console.log('Refreshing user avatar and kitty data on profile screen');
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing avatar and kitty data:', error);
    }
  }
};

export const calculateStreak = (workoutLogs: any[]): number => {
    if (!workoutLogs?.length) return 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...workoutLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Map of dates that have workouts
    const workoutDatesMap = new Map();
    sortedLogs.forEach(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const dateStr = logDate.toISOString().split('T')[0];
      workoutDatesMap.set(dateStr, true);
    });
    
    // Check yesterday first
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // If no workout yesterday, check today
    if (!workoutDatesMap.has(yesterdayStr)) {
      const todayStr = currentDate.toISOString().split('T')[0];
      if (workoutDatesMap.has(todayStr)) {
        return 1; // Today only
      }
      return 0; // No recent workouts
    }
    
    // Count back from yesterday
    let checkDate = new Date(yesterday);
    let checkingDate = true;
    
    while (checkingDate) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (workoutDatesMap.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        checkingDate = false;
      }
    }
    
    // Check if there's a workout today to add to streak
    const todayStr = currentDate.toISOString().split('T')[0];
    if (workoutDatesMap.has(todayStr)) {
      streak++;
    }
    
    return streak;
  };

export interface KittyHealth {
  healthPercentage: number;
  message: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export const calculateKittyHealth = (workoutLogs: any[]): KittyHealth => {
  if (!workoutLogs?.length) {
    return {
      healthPercentage: 0,
      message: "Your kitty needs your help! Start working out to improve your kitty's health.",
      status: 'poor'
    };
  }
  
  // Sort logs by date (newest first)
  const sortedLogs = [...workoutLogs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get date of most recent workout
  const mostRecentWorkoutDate = new Date(sortedLogs[0].date);
  const today = new Date();
  
  // Calculate days since last workout
  const daysSinceLastWorkout = Math.floor(
    (today.getTime() - mostRecentWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Determine health percentage based on consistency
  if (daysSinceLastWorkout <= 3) {
    // Worked out within the last 3 days - excellent health (100%)
    return {
      healthPercentage: 100,
      message: "Excellent! Your kitty is thriving with your consistent workouts!",
      status: 'excellent'
    };
  } else if (daysSinceLastWorkout <= 7) {
    // Worked out within the last week - good health (75%)
    return {
      healthPercentage: 75,
      message: "Your kitty is happy but would love another workout soon!",
      status: 'good'
    };
  } else if (daysSinceLastWorkout <= 14) {
    // Worked out within the last 2 weeks - fair health (50%)
    return {
      healthPercentage: 50,
      message: "Your kitty is getting restless. Time for a workout!",
      status: 'fair'
    };
  } else if (daysSinceLastWorkout <= 30) {
    // Worked out within the last month - poor health (25%)
    return {
      healthPercentage: 25,
      message: "Your kitty misses exercising with you. Don't wait any longer!",
      status: 'poor'
    };
  } else {
    // Hasn't worked out in over a month - critical health (0%)
    return {
      healthPercentage: 0,
      message: "Your kitty needs your help! Start working out to improve your kitty's health.",
      status: 'poor'
    };
  }
};