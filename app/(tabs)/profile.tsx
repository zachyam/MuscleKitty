import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Award, Calendar, Dumbbell, LogOut, Edit, X } from 'lucide-react-native';
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
import { supabase } from '@/utils/supabase';

// Kitty name storage key - must match the one in name-kitty.tsx
const KITTY_NAME_KEY = 'muscle_kitty_name';

export default function ProfileScreen() {
  // Get user data and the setUser function from context
  const { user, setUser } = useUser();
  const [kittyName, setKittyName] = useState<string>('');
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newKittyName, setNewKittyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Handle save of new kitty name
  const handleSaveKittyName = async () => {
    if (!newKittyName.trim() || !user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Store the new kitty name in AsyncStorage
      const userKittyNameKey = `${KITTY_NAME_KEY}_${user.id}`;
      await AsyncStorage.setItem(userKittyNameKey, newKittyName.trim());
      // Update Supabase user metadata
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { 
          kittyName: newKittyName.trim(),
        }
      });
      
      if (userUpdateError) {
        console.error('Error updating user metadata:', userUpdateError);
      }
      
      
      // Update kitty profile in Supabase for friend search
      const { updateKittyName } = await import('@/utils/friends');
      await updateKittyName(
        user.id,
        newKittyName.trim()
      );
      
      // Update local state
      setKittyName(newKittyName.trim());
      
      // Close modal and reset
      setShowNameModal(false);
      setNewKittyName('');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error saving new kitty name:', error);
      Alert.alert(
        "Error",
        "There was a problem updating your kitty's name. Please try again.",
        [{ text: "OK" }]
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Profile"
        rightIcon={<Settings size={24} color={Colors.text} />}
        onRightPress={() => setShowMenu(!showMenu)}
      />
      
      {/* Settings Menu */}
      {showMenu && (
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              setShowNameModal(true);
              setNewKittyName(kittyName);
            }}
          >
            <Edit size={18} color={Colors.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Change Kitty Name</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              handleLogout();
            }}
          >
            <LogOut size={18} color={Colors.error} style={styles.menuIcon} />
            <Text style={[styles.menuText, {color: Colors.error}]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Change Kitty Name Modal */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Kitty Name</Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.nameInput}
              placeholder="Enter new name"
              placeholderTextColor="#999"
              value={newKittyName}
              onChangeText={setNewKittyName}
              maxLength={20}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  (!newKittyName.trim() || isSubmitting) && styles.disabledButton
                ]}
                onPress={handleSaveKittyName}
                disabled={!newKittyName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image 
            source={typeof user?.avatarUrl === 'string' ? { uri: user.avatarUrl } : user?.avatarUrl}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{kittyName || 'Fitness User'}</Text>
          <Text style={styles.profileBio}>{user?.fullName || 'Fitness User'}</Text>
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
        
        {/* Removed logout button that was here previously as it's now in the dropdown menu */}
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
  menuContainer: {
    position: 'absolute',
    top: 55, // Adjust based on your header height
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    width: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  nameInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
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