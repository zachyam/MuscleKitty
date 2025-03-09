import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Award, Calendar, Dumbbell, LogOut } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { logout } from '@/utils/auth';
import { useUser } from '@/utils/UserContext';
import { useState, useEffect, useContext } from 'react';
import { getWorkoutLogs } from '@/utils/storage';
import ActivityGraph from '@/components/ActivityGraph';
import { WorkoutLog } from '@/types';

export default function ProfileScreen() {
  // Get user data and the setUser function from context
  const { user, setUser } = useUser();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [workoutStats, setWorkoutStats] = useState({
    thisMonth: 0,
    total: 0,
  });
  
  // Refresh avatar when profile screen loads
  useEffect(() => {
    const refreshAvatar = async () => {
      if (user) {
        try {
          // Import the overrideUserAvatar function
          const { overrideUserAvatar } = await import('@/utils/auth');
          
          // Override the avatar with the kitty image
          const updatedUser = await overrideUserAvatar(user);
          
          // Only update if the avatar has changed
          if (updatedUser.avatarUrl !== user.avatarUrl) {
            console.log('Refreshing user avatar on profile screen');
            setUser(updatedUser);
          }
        } catch (error) {
          console.error('Error refreshing avatar:', error);
        }
      }
    };
    
    refreshAvatar();
  }, [user?.id]); // Only run when user ID changes
  
  // Load workout logs
  useEffect(() => {
    const loadWorkoutLogs = async () => {
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
          const thisMonth = logs.filter(log => {
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
    
    loadWorkoutLogs();
  }, [user?.id]);
  
  // Current streak calculation
  const calculateStreak = (): number => {
    if (!workoutLogs.length) return 0;
    
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
  
  const streak = calculateStreak();
  
  const stats = [
    { label: 'Workouts', value: workoutStats.total.toString(), icon: <Dumbbell size={20} color={Colors.primary} /> },
    { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: <Calendar size={20} color={Colors.primary} /> },
    { label: 'Level', value: Math.max(1, Math.floor(workoutStats.total / 5)).toString(), icon: <Award size={20} color={Colors.primary} /> },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              // Clear user session from Supabase
              await logout();
              
              // Clear user data from context
              setUser(null);
              
              // Navigate to login screen
              router.navigate('/login');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Profile"
        rightIcon={<Settings size={24} color={Colors.text} />}
        onRightPress={() => {}}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image 
            source={typeof user?.avatarUrl === 'string' ? { uri: user.avatarUrl } : user?.avatarUrl}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{user?.name || 'Fitness User'}</Text>
          <Text style={styles.profileBio}>{user?.email || 'On a journey to become stronger!'}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              {stat.icon}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workoutStats.thisMonth}</Text>
              <Text style={styles.summaryLabel}>This Month</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workoutStats.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>
        </View> */}
        
        <View style={styles.section}>
          <View style={styles.activityGraphContainer}>
            <ActivityGraph 
              workoutLogs={workoutLogs} 
              months={3}
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={Colors.error} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bottomSafeArea: {
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  profileName: {
    fontWeight: 'bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  section: {
    marginBottom: 16,
    marginTop: 12,
    width: '100%',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontWeight: 'bold',
    fontSize: 24,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  activityGraphContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    width: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224, 122, 95, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.2)',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 16,
  }
});