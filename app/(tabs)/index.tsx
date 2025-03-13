import React from 'react';
import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ImageBackground, Animated, Easing } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkouts, deleteWorkout, getWorkoutLogs } from '@/utils/storage';
import { Workout, WorkoutLog } from '@/types';
import Header from '@/components/Header';
import WorkoutCard from '@/components/WorkoutCard';
import { UserContext } from '@/utils/UserContext';
import { calculateStreak, calculateKittyHealth, KittyHealth } from '@/utils/loadStats';

function WorkoutPlansScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const textFadeAnim = useRef(new Animated.Value(1)).current; // For text fade animation
  const kittySwayAnim = useRef(new Animated.Value(0)).current; // For kitty swaying animation
  const { user } = useContext(UserContext);

  // Load workouts when the screen comes into focus or user changes
  useFocusEffect(
    useCallback(() => {
      console.log('WorkoutPlansScreen - useFocusEffect triggered');
      loadWorkouts();
      loadWorkoutLogs();
      
      // Also restart animation when screen is focused
      startHorizontalAnimation();
    }, [user?.id]) // Reload when user changes
  );
  

  const loadWorkouts = async () => {
    setLoading(true);
    // Get only workouts for the current user
    // const savedWorkouts = await generateFakeWorkouts(user?.id);

    // TEMPORARY: Generate fake data for demo purposes - REMOVE THIS LATER
    const { generateFakeWorkouts } = await import('@/utils/storage');
    const savedWorkouts = await generateFakeWorkouts(user?.id);
    
    setWorkouts(savedWorkouts);
    setLoading(false);
  };
  
  const loadWorkoutLogs = async () => {
    if (user?.id) {
      try {
        // TEMPORARY: Generate fake data for demo purposes - REMOVE THIS LATER
        const { generateFakeWorkoutLogs } = await import('@/utils/storage');
        await generateFakeWorkoutLogs(user.id);
        
        // Get logs AFTER generating fake data
        const logs = await getWorkoutLogs(user.id);
        setWorkoutLogs(logs);
      } catch (error) {
        console.error('Error loading workout logs:', error);
      }
    }
  };

  const handleCreateWorkout = () => {
    router.push('/create-workout');
  };

  const handleSelectWorkout = (workout: Workout) => {
    router.push({
      pathname: '/workout-details',
      params: { id: workout.id }
    });
  };

  const handleEditWorkout = (workoutId: string) => {
    router.push({
      pathname: '/edit-workout',
      params: { id: workoutId }
    });
  };

  const streak = calculateStreak(workoutLogs);
  const kittyHealth = calculateKittyHealth(workoutLogs);
  
  const toggleExplanation = () => {
    // Fade out current text
    Animated.timing(textFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      // Toggle the message
      setShowExplanation(prev => !prev);
      
      // Fade in new text
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 300,
        delay: 50,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start();
    });
  };

  // Set up text animation timer
  useEffect(() => {
    // Text animation timer
    const textTimer = setInterval(() => {
      toggleExplanation();
    }, 5000);
    
    return () => {
      clearInterval(textTimer);
    };
  }, []);
  
  // Define the animation function outside of useEffect to reuse it
  const startHorizontalAnimation = () => {
    // First, reset to center position
    kittySwayAnim.setValue(0);
    
    // Then create a seamless looping animation from center → right → left → center
    Animated.loop(
      // Use timing for smooth gradual motion
      Animated.timing(kittySwayAnim, {
        toValue: 1,           // Move to right fully
        duration: 3000,       // Over 3 seconds
        useNativeDriver: true,
        easing: Easing.linear // Perfect linear motion for full duration
      }),
      // No delay/reset between cycles
      { iterations: -1 }      // Infinite loop
    ).start();
  };

  // Start animation initially and when component mounts
  useEffect(() => {
    startHorizontalAnimation();
    
    // Clean up the animation when component unmounts
    return () => {
      kittySwayAnim.stopAnimation();
    };
  }, []);

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert(
      'Delete Workout Plan',
      'Are you sure you want to delete this workout plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(workoutId);
            loadWorkouts();
          }
        }
      ]
    );
  };

  // Ensure user has default values for coins, xp, and level
  useEffect(() => {
    if (user && user.hasCompletedOnboarding) {
      // To be safe, make sure these properties exist if they're not there
      if (user.coins === undefined || user.xp === undefined || user.level === undefined) {
        const { setUser } = useContext(UserContext);
        setUser({
          ...user,
          coins: user.coins ?? 50,
          xp: user.xp ?? 0,
          level: user.level ?? 1
        });
      }
    }
  }, [user]);
  
  return (
    <View style={styles.container}>
      {/* Hero Background - Takes up entire top half */}
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: 'https://i.pinimg.com/736x/88/4c/3c/884c3c4285c79df0be1371b5344788da.jpg' }}
          style={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          
          {/* Coins display positioned in top left with fun design */}
          <View style={styles.coinContainer}>
            <View style={styles.coinIconWrapper}>
              <Text style={styles.coinIcon}>🌕</Text>
            </View>
            <Text style={styles.coinCount}>{user?.coins || 0}</Text>
          </View>
          
          <View style={styles.heroContent}>
            <Animated.Image 
              source={typeof user?.avatarUrl === 'string' ? { uri: user.avatarUrl } : user?.avatarUrl}
              style={[
                styles.kittenImage,
                {
                  transform: [
                    {
                      translateX: kittySwayAnim.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: [0, 8, 0, -8, 0], // Full cycle: center → right → center → left → center
                        extrapolate: 'clamp'
                      })
                    }
                  ]
                }
              ]} 
            />
          </View>
        </ImageBackground>
      </View>
      
      {/* Content Section - Starts with the streak card overlapping the hero */}
      <SafeAreaView style={styles.safeArea}>        
        <View style={styles.contentContainer}>
          {/* Kitty Health Card - Positioned to overlap with the hero image */}
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.streakInfo}>
                <Text style={styles.fireEmoji}>
                  {kittyHealth.status === 'excellent' ? '😸' : 
                   kittyHealth.status === 'good' ? '😺' : 
                   kittyHealth.status === 'fair' ? '😿' : '🙀'}
                </Text>
                <View style={styles.messageContainer}>
                  <Animated.Text style={[styles.healthText, { opacity: textFadeAnim }]}>
                    {showExplanation 
                      ? "Your kitty's health is based on your workout consistency. Work out regularly to maintain your kitty's health!"
                      : kittyHealth.message}
                  </Animated.Text>
                </View>
              </View>
            </View>
            <View style={styles.healthStatsContainer}>
              <View style={styles.streakContainer}>
                <Text style={styles.streakText}>Workout Streak: {streak} day{streak !== 1 ? 's' : ''}</Text>
                <View style={styles.rocketContainer}>
                  {Array.from({ length: Math.min(streak, 7) }).map((_, index) => (
                    <Text key={index} style={styles.rocketEmoji}>🚀</Text>
                  ))}
                  {streak > 7 && <Text style={styles.extraStreakText}>+{streak - 7}</Text>}
                </View>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${kittyHealth.healthPercentage}%`,
                      backgroundColor: 
                        kittyHealth.status === 'excellent' ? '#4CAF50' : 
                        kittyHealth.status === 'good' ? '#8BC34A' : 
                        kittyHealth.status === 'fair' ? '#FFC107' : 
                        '#FF5722'
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
          
          {/* Workout Plans Section */}
          <View style={styles.workoutPlansHeader}>
            <Text style={styles.sectionTitle}>Your Workout Plans</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleCreateWorkout}>
              <Plus size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {workouts.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={styles.emptyText}>No workout plans yet!</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create your first workout plan</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
                <Text style={styles.createButtonText}>Create Workout Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <WorkoutCard 
                  workout={item} 
                  onPress={() => handleSelectWorkout(item)} 
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default WorkoutPlansScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244, 244, 220)',
  },
  coinContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  coinIconWrapper: {
    marginRight: 5,
  },
  coinIcon: {
    fontSize: 18,
  },
  coinCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  // Hero styles - Taking up exactly half the screen height
  heroContainer: {
    height: '50%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  kittenImage: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238, 231, 231, 0.34)',
  },
  heroContent: {
    padding: 20,
    paddingBottom: 60, // Extra padding at bottom for card overlap
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Content container - Starts below hero with streak card overlapping
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: '75%', // Positioned to create overlap with hero
    zIndex: 1,
  },
  streakCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.3)',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align to top to prevent shifting
    marginBottom: 12,
  },
  streakInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  fireEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  messageContainer: {
    flex: 1,
    height: 60, // Fixed height to prevent layout shifts during animation
  },
  healthText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    flexWrap: 'wrap',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  streakText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  rocketContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rocketEmoji: {
    fontSize: 16,
    marginRight: 2,
  },
  extraStreakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 2,
  },
  workoutCount: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  healthStatsContainer: {
    marginBottom: 12,
    backgroundColor: 'rgba(143, 201, 58, 0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.2)',
  },
  progressContainer: {
    height: 12,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  progressBar: {
    flex: 1,
    borderRadius: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  workoutPlansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'Colors.text',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  addGoalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addGoalIconText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  addGoalText: {
    fontSize: 16,
    color: Colors.text,
  }
});