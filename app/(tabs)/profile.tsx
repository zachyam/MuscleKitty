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
import { calculateStreak, calculateKittyHealth } from '@/utils/loadStats';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kitty name storage key - must match the one in name-kitty.tsx
const KITTY_NAME_KEY = 'muscle_kitty_name';

export default function ProfileScreen() {
  // Get user data and the setUser function from context
  const { user, setUser } = useUser();
  const [kittyName, setKittyName] = useState<string>('');
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [workoutStats, setWorkoutStats] = useState({
    thisMonth: 0,
    total: 0,
  });
  
  // Load kitty name directly from AsyncStorage
  useEffect(() => {
    const loadKittyName = async () => {
      if (user?.id) {
        try {
          const userKittyNameKey = `${KITTY_NAME_KEY}_${user.id}`;
          const storedKittyName = await AsyncStorage.getItem(userKittyNameKey);
          
          if (storedKittyName) {
            console.log('Loaded kitty name from storage:', storedKittyName);
            setKittyName(storedKittyName);
          } else if (user.kittyName) {
            // If the kitty name is already in the user object, use that
            console.log('Using kitty name from user object:', user.kittyName);
            setKittyName(user.kittyName);
          }
        } catch (error) {
          console.error('Error loading kitty name:', error);
        }
      }
    };
    
    loadKittyName();
  }, [user?.id]);
  
  // Refresh avatar when profile screen loads
  useEffect(() => {
    const updateAvatar = async () => {
      if (user) {
        try {
          // Use the abstracted function from loadStats
          const { refreshAvatar } = await import('@/utils/loadStats');
          refreshAvatar(user, setUser);
        } catch (error) {
          console.error('Error refreshing avatar:', error);
        }
      }
    };
    
    updateAvatar();
  }, [user?.id]); // Only run when user ID changes
  
  // Load workout logs
  useEffect(() => {
    const loadLogs = async () => {
      if (user?.id) {
        try {
          // Use the abstracted function from loadStats
          const { loadWorkoutLogs } = await import('@/utils/loadStats');
          loadWorkoutLogs(user, setWorkoutLogs, setWorkoutStats);
        } catch (error) {
          console.error('Error loading workout logs:', error);
        }
      }
    };
    
    loadLogs();
  }, [user?.id]);
  
  // Get streak and kitty health from utility functions
  const streak = calculateStreak(workoutLogs);
  const kittyHealth = calculateKittyHealth(workoutLogs);
  
  const stats = [
    { label: 'Workouts', value: workoutStats.total.toString(), icon: <Dumbbell size={20} color={Colors.primary} /> },
    { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: <Calendar size={20} color={Colors.primary} /> },
    { 
      label: 'Kitty Health', 
      value: `${kittyHealth.healthPercentage}%`, 
      icon: <Text style={{fontSize: 20, marginRight: 5}}>
        {kittyHealth.status === 'excellent' ? '😸' : 
         kittyHealth.status === 'good' ? '😺' : 
         kittyHealth.status === 'fair' ? '😿' : '🙀'}
      </Text> 
    },
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
          {kittyName ? (
            <Text style={styles.kittyName}>Kitty: {kittyName}</Text>
          ) : null}
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
  kittyName: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
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