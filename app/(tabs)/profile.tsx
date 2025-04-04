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
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import { KITTY_PROFILES } from '@/components/AdoptKittyScreenComponents';
import AdoptKittyScreenComponents from '@/components/AdoptKittyScreenComponents';
import FancyAlert from '@/components/FancyAlert';

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
  const handleChangeKittyBreed = async () => {
    console.log('User is adopting kitty:', selectedKitty.breed);
    setChangeKittyBreed(false);
  }

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

          <TouchableOpacity style={styles.adoptButton} onPress={handleChangeKittyBreed}>
            <Text style={styles.adoptButtonText}>Adopt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Header 
            title="Profile"
            rightIcon={<Settings size={24} color={Colors.text} />}
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
                      <Edit size={18} color={Colors.text} style={styles.menuIcon} />
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
                source={typeof user?.avatarUrl === 'string' ? { uri: user.avatarUrl } : user?.avatarUrl}
                style={styles.profileImage}
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
                <ActivityGraph workoutLogs={workoutLogs} months={3} />
              </View>
            </View>
  
          {/* <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} /> */}
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
    zIndex: 9, // should be just under menuContainer’s 10
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
});