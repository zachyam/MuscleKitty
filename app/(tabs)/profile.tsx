import React, { useState, useEffect, useCallback }from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Calendar, Dumbbell, LogOut, Edit, X, PersonStanding, Cat } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useFocusEffect } from 'expo-router';
import Header from '@/components/Header';
import { logout } from '@/utils/auth';
import { useUser } from '@/utils/UserContext';
import { KITTY_ID_TO_BREED, KITTY_IMAGES } from '@/app/name-kitty';
import ActivityGraph from '@/components/ActivityGraph';
import { WorkoutLog } from '@/types';
import { calculateStreak, calculateKittyHealth } from '@/utils/loadStats';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, deleteSupabaseUser } from '@/utils/supabase';
import AdoptKittyScreenComponents, { KITTY_PROFILES } from '@/components/AdoptKittyScreenComponents';
import FancyAlert from '@/components/FancyAlert';

// Storage keys - must match those used elsewhere in the app
const KITTY_NAME_KEY = 'muscle_kitty_name';
const KITTY_BREED_ID_KEY = 'muscle_kitty_breed_id';
const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';
const USER_STORAGE_KEY = 'muscle_kitty_user_data';

export default function ProfileScreen() {
  // Get user data and the setUser function from context
  const { user, setUser, updateUserAttributes } = useUser();
  const [kittyName, setKittyName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [kittyBreed, setKittyBreed] = useState<string>('');
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newKittyName, setNewKittyName] = useState('');
  const [newKittyBreed, setNewKittyBreed] = useState('');
  const [changeKittyBreed, setChangeKittyBreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutStats, setWorkoutStats] = useState({
    thisMonth: 0,
    total: 0,
  });
  const [selectedKittyIndex, setSelectedKittyIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  
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
    const loadKittyAvatar = async () => {
      if (user?.id) {
        try {
          
          const breedId = user.kittyBreedId
          
          // Get from AsyncStorage if not in user object
          if (!breedId) {
            const userKittyBreedIdKey = `${KITTY_BREED_ID_KEY}_${user.id}`;
            const storedKittyBreedId = await AsyncStorage.getItem(userKittyBreedIdKey);
            if (storedKittyBreedId) {
              setSelectedKittyIndex(parseInt(storedKittyBreedId));
              setAvatarUrl(KITTY_IMAGES[storedKittyBreedId]);
              setKittyBreed(KITTY_ID_TO_BREED[storedKittyBreedId] || '');
              console.log('Using kitty breed from AsyncStorage:', storedKittyBreedId);
            }
          } else {
            // Use the breed ID from user object
            console.log('Using kitty breed from user object:', breedId);
            setSelectedKittyIndex(parseInt(breedId));
            setAvatarUrl(KITTY_IMAGES[breedId]);
            setKittyBreed(KITTY_ID_TO_BREED[breedId] || '');
          }
        } catch (error) {
          console.error('Error loading kitty breed:', error);
        }
      }
    };
    
    loadKittyAvatar();
  }, [user?.id]);

  // Load workout logs
  useFocusEffect(
      useCallback(() => {
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
      }, [user?.id])
    );
  
  // Get streak and kitty health from utility functions
  const streak = calculateStreak(workoutLogs);
  const kittyHealth = calculateKittyHealth(workoutLogs);
  const selectedKitty = KITTY_PROFILES[selectedKittyIndex];

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
              // Show splash screen during logout process
              setTimeout(() => {
                // First navigate to splash screen for a smooth transition
                router.replace('/login');
              }, 1500);
              
              // Clear user session from Supabase
              await logout();
              
              // Clear user data from context
              setUser(null);
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
      setShowAlert(true);
      setAlertMessage("There was a problem updating your kitty's name. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Handle change kitty breed
  const handleSaveKittyBreed = async () => {
    if (!user?.id) return;
    console.log('Saving kitty breed:', selectedKitty.breed);
    try {
      setIsSubmitting(true);
      
      // Store the new kitty breed in AsyncStorage
      const userKittyBreedIdKey = `${KITTY_BREED_ID_KEY}_${user.id}`;
      await AsyncStorage.setItem(userKittyBreedIdKey, selectedKittyIndex.toString());
      
      // Update Supabase user metadata
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { 
          kittyBreed: KITTY_ID_TO_BREED[selectedKittyIndex],
          kittyBreedId: selectedKittyIndex.toString(), // Add this to keep user metadata consistent
        }
      });
      
      if (userUpdateError) {
        console.error('Error updating user metadata:', userUpdateError);
      }
      
      // Update kitty profile in Supabase for friend search
      const { updateKittyBreed } = await import('@/utils/friends');
      await updateKittyBreed(
        user.id,
        selectedKittyIndex.toString()
      );

      console.log('Updating user attributes with kittyBreedId:', selectedKittyIndex.toString());
      await updateUserAttributes({
        kittyBreedId: selectedKittyIndex.toString(),
        avatarUrl: KITTY_IMAGES[selectedKittyIndex]
      });
      
      // Update local state
      setKittyBreed(selectedKitty.breed);
      setAvatarUrl(KITTY_IMAGES[selectedKittyIndex]);
      
      // Close modal and reset
      setShowNameModal(false);
      setNewKittyBreed('');
      setIsSubmitting(false);
      setChangeKittyBreed(false);
    } catch (error) {
      console.error('Error saving new kitty breed:', error);
      setShowAlert(true);
      setAlertMessage("There was a problem updating your kitty's breed. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently delete all your data including your kitty, workouts, and friends. This action cannot be undone.\n\nNote: The auth user will only be fully deleted when the Edge Function is deployed.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete Account", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              if (!user?.id) {
                throw new Error('User ID not found');
              }
              
              // 1. Delete all workout logs and exercises for this user
              const { data: workoutLogs, error: workoutLogsError } = await supabase
                .from('workout_logs')
                .select('id')
                .eq('user_id', user.id);
              
              if (workoutLogsError) {
                console.error('Error fetching workout logs:', workoutLogsError);
              } else if (workoutLogs && workoutLogs.length > 0) {
                // For each workout log, delete associated exercise logs
                for (const log of workoutLogs) {
                  await supabase
                    .from('exercise_logs')
                    .delete()
                    .eq('workout_log_id', log.id);
                }
                
                // Delete all workout logs
                await supabase
                  .from('workout_logs')
                  .delete()
                  .eq('user_id', user.id);
              }
              
              // 2. Delete all workout plans and exercises for this user
              const { data: workoutPlans, error: workoutPlansError } = await supabase
                .from('workout_plans')
                .select('id')
                .eq('user_id', user.id);
              
              if (workoutPlansError) {
                console.error('Error fetching workout plans:', workoutPlansError);
              } else if (workoutPlans && workoutPlans.length > 0) {
                // For each workout plan, delete associated exercises
                for (const plan of workoutPlans) {
                  await supabase
                    .from('workout_exercises')
                    .delete()
                    .eq('workout_plan_id', plan.id);
                }
                
                // Delete all workout plans
                await supabase
                  .from('workout_plans')
                  .delete()
                  .eq('user_id', user.id);
              }
              
              // 3. Delete all friends relationships (bidirectional)
              // First, get the user's kitty hash to find reverse relationships
              const { data: userProfile } = await supabase
                .from('kitty_profiles')
                .select('kitty_hash')
                .eq('user_id', user.id)
                .single();
              
              if (userProfile?.kitty_hash) {
                // Delete friendships where others have added this user
                await supabase
                  .from('friends')
                  .delete()
                  .eq('friend_kitty_hash', userProfile.kitty_hash);
              }
              
              // Delete friendships where this user added others
              await supabase
                .from('friends')
                .delete()
                .eq('user_id', user.id);
              
              // 4. Delete kitty profile
              await supabase
                .from('kitty_profiles')
                .delete()
                .eq('user_id', user.id);
              
              // 5. Delete user data from local storage
              const userKittyNameKey = `${KITTY_NAME_KEY}_${user.id}`;
              const userKittyKey = `${SELECTED_KITTY_KEY}_${user.id}`;
              const onboardingKey = `onboarding_completed_${user.id}`;
              
              await AsyncStorage.removeItem(userKittyNameKey);
              await AsyncStorage.removeItem(userKittyKey);
              await AsyncStorage.removeItem(onboardingKey);
              await AsyncStorage.removeItem(USER_STORAGE_KEY);
              
              // 6. Delete the Supabase auth user using our Edge Function
              const { success: deleteSuccess, error: deleteError } = await deleteSupabaseUser(user.id);
              
              if (deleteError) {
                console.error('Error deleting auth user:', deleteError);
                // Continue anyway to log the user out
              }
              
              // 7. Log out the user and redirect to login screen
              await logout();
              setUser(null);
              
              // Navigate to login screen
              router.replace('/login');
              
            } catch (error) {
              console.error('Error deleting account:', error);
              setShowAlert(true);
              setAlertMessage("There was a problem deleting your account. Please try again.");
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {showAlert && (
        <FancyAlert
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}
      {changeKittyBreed ? (
        <View style={styles.content}>
            <AdoptKittyScreenComponents
            selectedKittyIndex={selectedKittyIndex}
            setSelectedKittyIndex={setSelectedKittyIndex}
          />

          <TouchableOpacity 
            style={[styles.adoptButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSaveKittyBreed}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.adoptButtonText}>Adopt</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Header 
            title="Profile"
            rightIcon={<Settings size={24} color={Colors.text} style={styles.settingsIcon} />}
            onRightPress={() => setShowMenu(!showMenu)}
          />
  
          {/* Settings Menu */}
          {showMenu && (
            <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
              <View style={styles.backdrop}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.menuContainer}>
                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => {
                        setShowMenu(false);
                        setChangeKittyBreed(true);
                      }}
                    >
                      <Cat size={18} color={Colors.text} style={styles.menuIcon} />
                      <Text style={styles.menuText}>Change Kitty Avatar</Text>
                    </TouchableOpacity>
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
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
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
  

          <View style={styles.profileHeader}>
              <Image 
                source={user?.avatarUrl 
                  ? (typeof user.avatarUrl === 'string' 
                     ? { uri: user.avatarUrl } 
                     : user.avatarUrl) 
                  : user?.kittyBreedId 
                    ? KITTY_IMAGES[user.kittyBreedId] 
                    : KITTY_IMAGES['0']}
                style={styles.profileImage}
                onError={() => console.log('Failed to load avatar image in Profile')}
              />
              <Text style={styles.profileName}>{kittyName || ''}</Text>
              <Text style={styles.profileBio}>{user?.fullName || ''}</Text>
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
                <ActivityGraph workoutLogs={workoutLogs} />
              </View>
            </View>
            
            {/* Delete Account Button */}
            <View style={styles.deleteAccountContainer}>
              <TouchableOpacity 
                style={styles.deleteAccountButton}
                onPress={handleDeleteAccount}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEA',
  },
  bottomSafeArea: {
    backgroundColor: '#FFFBEA',
  },
  content: {
    flex: 1,
    alignItems: 'center'
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom:30
  },
  profileImage: {
    width: 110,
    height: 110,
    marginBottom: 5,
    shadowColor: '#C1AC88',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  profileName: {
    fontWeight: '700',
    fontSize: 22,
    color: '#5E503F',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 14,
    color: '#A89A86',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 20
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF4D6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ECD9B5',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#5E503F',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#8C7B6D',
    marginTop: 2,
  },
  section: {
    marginTop: 0,
    width: '100%',
    padding: 20
  },
  activityGraphContainer: {
    backgroundColor: '#FFF4D6',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3CB9F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  menuContainer: {
    position: 'absolute',
    top: 55,
    right: 16,
    backgroundColor: '#FFF4D6',
    borderRadius: 8,
    padding: 8,
    width: 200,
    borderColor: '#ECD9B5',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
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
    color: '#5E503F',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF4D6',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderColor: '#ECD9B5',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    color: '#5E503F',
  },
  nameInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ECD9B5',
    color: '#5E503F',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECD9B5',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#5E503F',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#A3D977',
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9, // should be just under menuContainer's 10
  },
  adoptButton: {
    backgroundColor: Colors.primary,
    width: '85%',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 0,
  },
  adoptButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsIcon: {
    padding: 8,  // Add more padding around the icon for a better touch target
  },
  // Delete account button styles
  deleteAccountContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteAccountButton: {
    backgroundColor: Colors.error,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '60%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});