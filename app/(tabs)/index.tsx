import React from 'react';
import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ImageBackground, Animated, Easing, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Dumbbell, ArrowUp, ChevronDown, Pencil, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkouts, deleteWorkout, getWorkoutLogs } from '@/utils/storageAdapter';
import { getWorkoutInProgress, clearWorkoutInProgress } from '@/utils/storage';
import { Workout, WorkoutLog } from '@/types';
import WorkoutLogCard from '@/components/WorkoutLogCard';
import { UserContext } from '@/utils/UserContext';
import { calculateStreak, calculateKittyHealth, KittyHealth } from '@/utils/loadStats';
import { Dimensions } from 'react-native';
import CoinIcon from '@/components/CoinIcon'
import { useLocalSearchParams } from 'expo-router';
import { KITTY_GIFS } from '../name-kitty';

function WorkoutPlansScreen() {
  const { user } = useContext(UserContext);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalCoins, setTotalCoins] = useState(user?.coins || 0);
  const [showWorkoutPlans, setShowWorkoutPlans] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [isDayTime, setIsDayTime] = useState(true);
  const textFadeAnim = useRef(new Animated.Value(1)).current; // For text fade animation
  const kittySwayAnim = useRef(new Animated.Value(0)).current; // For kitty swaying animation
  const workoutPanelAnim = useRef(new Animated.Value(0)).current; // For workout panel slide-up animation
  const screenHeight = Dimensions.get('window').height;
  const { selectedWorkoutId } = useLocalSearchParams<{ selectedWorkoutId?: string }>();

  // Load workouts when the screen comes into focus or user changes
  useFocusEffect(
    useCallback(() => {
      console.log('WorkoutPlansScreen - useFocusEffect triggered');
      loadWorkouts();
      loadWorkoutLogs();
      getCurrentTime();
      checkWorkoutInProgress();
      
      // Update coins when screen comes into focus
      if (user) {
        console.log("user triggered in workout plans screen", user);
        setTotalCoins(user.coins || 0);
      }
      
      // Also restart animation when screen is focused
      startHorizontalAnimation();
    }, [user?.id, user?.coins]) // Reload when user changes or coins update
  );
  
  // Function to check for workout in progress and prompt user
  const checkWorkoutInProgress = async () => {
    try {
      const workoutInProgress = await getWorkoutInProgress();
      
      if (workoutInProgress) {
        // Found a recent workout in progress, ask user if they want to resume
        Alert.alert(
          'Resume Workout',
          'You have a workout in progress. Would you like to resume?',
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: async () => {
                // Clear the workout in progress
                await clearWorkoutInProgress();
              }
            },
            {
              text: 'Resume',
              onPress: () => {
                // Navigate to the workout, passing the workout ID
                router.push({
                  pathname: '/start-workout',
                  params: {
                    id: workoutInProgress.workoutLog.workoutId,
                    resumeWorkout: 'true'
                  }
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for workout in progress:', error);
    }
  };

  // useEffect(() => {
  //   if (!loading && selectedWorkoutId && workouts.length > 0 && workoutLogs) {
  //     const workout = workouts.find(w => w.id === selectedWorkoutId);
  //     if (workout) {
  //       setShowWorkoutPlans(true);

  //       Animated.timing(workoutPanelAnim, {
  //         toValue: 1,
  //         duration: 300,
  //         useNativeDriver: true,
  //       }).start(() => {
  //         console.log('Panel animation complete, selecting workout');
  //         handleSelectWorkout(workout);
  //       });
  //     } else {
  //       setShowWorkoutPlans(true);
  //     }
  //   }
  // }, [loading, selectedWorkoutId, workouts, workoutLogs]);

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 7 && hours < 19) {
      console.log("It is day time");
      setIsDayTime(true);
    } else {
      console.log("It is night time");
      setIsDayTime(false);
    }
    return;
  }
  

  const loadWorkouts = async () => {
    setLoading(true);
    if (user?.id) {
      // Get only workouts for the current user
      const savedWorkouts = await getWorkouts(user.id);
      setWorkouts(savedWorkouts);
    }
    setLoading(false);
  };
  
  const loadWorkoutLogs = async () => {
    if (user?.id) {
      try {
        // Get workout logs from storage
        const logs = await getWorkoutLogs(user.id);
        
        // Debug log IDs
        if (logs.length > 0) {
          console.log('WorkoutPlansScreen: Workout log IDs:', 
            logs.slice(0, 5).map(log => `${log.id} (${log.workoutName})`).join(', '));
        }
        
        setWorkoutLogs(logs);
        
        // Reset selection when logs are reloaded
        setSelectedWorkout(null);
        setWorkoutHistory([]);
        
        console.log(`Loaded ${logs.length} workout logs for user ${user.id}`);
      } catch (error) {
        console.error('Error loading workout logs:', error);
      }
    }
  };

  const handleCreateWorkout = () => {
    router.push('/create-workout');
  };

  const handleSelectWorkout = (workout: Workout) => {
    // If already selected, deselect it - removed this logic to support the new UI flow
    // Now we'll use the back button to return to the list
    console.log('in handleSelectWorkout', workout.id)
    // Select the workout
    setSelectedWorkout(workout.id);
    
    // Find logs for this workout
    const filteredLogs = workoutLogs.filter(log => log.workoutId === workout.id);
    
    // Sort by date (newest first)
    filteredLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Found ${filteredLogs.length} logs for workout ${workout.name} (ID: ${workout.id})`);
    
    // Update workout history
    setWorkoutHistory(filteredLogs);
  };

  const handleEditWorkout = (workoutId: string) => {
    // Prevent event propagation when edit is clicked
    router.push({
      pathname: '/edit-workout',
      params: { id: workoutId }
    });
  };
  
  const toggleWorkoutPanel = () => {
    const isOpening = !showWorkoutPlans;
    
    // Toggle panel visibility state
    setShowWorkoutPlans(isOpening);
    
    // Animate panel sliding up or down
    Animated.timing(workoutPanelAnim, {
      toValue: isOpening ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      // If we're closing the panel, reset once animation is done
      if (!isOpening) {
        setSelectedWorkout(null);
        setWorkoutHistory([]);
      }
    });
  };
  
  const handleViewLog = (log: WorkoutLog) => {
    console.log(`WorkoutPlansScreen: Viewing log with ID: ${log.id}, name: ${log.workoutName}`);
    
    // Verify the log ID format
    if (!log.id || typeof log.id !== 'string') {
      console.error('WorkoutPlansScreen: Invalid log ID:', log.id);
      Alert.alert('Error', 'Invalid workout log ID.');
      return;
    }
    
    // Navigate to the log details
    router.push({
      pathname: '/workout-log',
      params: {
        id: log.id,
        fromWorkoutId: log.workoutId,
      },
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

  // Ensure user has default values for coins, xp, and level
  useEffect(() => {
    if (user && user.hasCompletedOnboarding) {
      // To be safe, make sure these properties exist if they're not there
      if (user.coins === undefined || user.xp === undefined || user.level === undefined) {
        const { setUser } = useContext(UserContext);
        setUser({
          ...user,
          coins: user.coins ?? 0,
          xp: user.xp ?? 10,
          level: user.level ?? 1
        });
      }
    }
  }, [user]);
  
  return (
    <View style={isDayTime ? styles.containerDayTime : styles.containerNightTime}>
      {/* Hero Background - Takes up entire top half */}
      <View style={styles.heroContainer}>
        <ImageBackground
          // source={{ uri: 'https://i.pinimg.com/736x/88/4c/3c/884c3c4285c79df0be1371b5344788da.jpg' }}
          source={isDayTime ? require('@/assets/images/gym-background-light.png') : require('@/assets/images/gym-night.png')}
          style={styles.heroImage}
        >
          {/* <View style={styles.heroOverlay} /> */}
          
          {/* Coins display positioned in top left with fun design */}
          <View style={styles.coinContainer}>
          <View style={styles.coinIconWrapper}>
            <CoinIcon />
          </View>
            <Text style={styles.coinCount}>{totalCoins}</Text>
          </View>
          
          <View style={styles.heroContent}>
            <Animated.Image 
              source={user?.kittyBreedId 
                  ? KITTY_GIFS[user.kittyBreedId] 
                  : KITTY_GIFS['0']}
              style={[
                styles.kittenImage,
                {
                  transform: [
                    {
                      translateX: kittySwayAnim.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: [0, 5, 0, -5, 0], // Full cycle: center → right → center → left → center
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
          
          {/* Workout Panel Button */}
          <TouchableOpacity 
            style={styles.workoutPanelButton} 
            onPress={toggleWorkoutPanel}
            activeOpacity={0.8}
          >
            <Text style={styles.workoutPanelButtonText}>
              { "View Workout Plans"}
            </Text>
          </TouchableOpacity>
          
          {/* Workout Plans Panel (slides up when shown) */}
          <Animated.View 
            style={[
              styles.workoutPanelContainer,
              {
                transform: [
                  {
                    translateY: workoutPanelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [screenHeight, screenHeight * 0.05], // Adjusted to match the new panel position
                      extrapolate: 'clamp',
                    }),
                  },
                ],
                opacity: workoutPanelAnim,
              }
            ]}
          >
            <View style={styles.panelHeader}>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={toggleWorkoutPanel}
                >
                  <ChevronDown size={30} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.panelTitle} onPress={toggleWorkoutPanel}>Workout Plans</Text>
                {workouts.length > 0 && (
                  <TouchableOpacity style={styles.addButton} onPress={handleCreateWorkout}>
                    <Plus size={18} color="#fff" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            
            {/* Workout Plans */}
            {workouts.length === 0 && !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏋️</Text>
                <Text style={styles.emptyText}>No workout plans yet!</Text>
                <Text style={styles.emptySubtext}>Tap the button to create your first workout plan</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
                  <Text style={styles.createButtonText}>Create Workout Plan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.panelScrollView} showsVerticalScrollIndicator={false}>
                {!selectedWorkout ? (
                  // Show list of workout plans when no workout is selected
                  <View style={styles.workoutListContainer}>
                    <View style={styles.workoutCardsGrid}>
                      {workouts.map(workout => (
                        <View key={workout.id} style={styles.workoutPlanCardContainer}>
                          <TouchableOpacity 
                            style={styles.workoutPlanCard}
                            onPress={() => handleSelectWorkout(workout)} 
                          >
                            <View style={styles.workoutCardIcon}>
                              <Dumbbell color="#4CAF50"/>
                            </View>
                            <View style={styles.workoutCardContent}>
                              <Text style={styles.workoutPlanCardTitle}>{workout.name}</Text>
                              <Text style={styles.workoutPlanCardSubtitle}>
                                {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          
                          <View style={styles.workoutCardActions}>
                            <TouchableOpacity 
                              style={styles.workoutCardAction}
                              onPress={() => handleEditWorkout(workout.id)}
                            >
                              <Pencil size={18} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  // Show workout details when a workout is selected
                  <View style={styles.workoutDetailContainer}>
                    {/* Back button to return to workout list */}
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={() => setSelectedWorkout(null)}
                    >
                      <Text style={styles.backButtonText}>← Back to All Workouts</Text>
                    </TouchableOpacity>
                    
                    {/* Workout Details */}
                    {(() => {
                      const workout = workouts.find(w => w.id === selectedWorkout);
                      if (!workout) return null;
                      
                      return (
                        <View style={styles.workoutDetailCard}>
                          <View style={styles.workoutDetailHeader}>
                            <View style={styles.workoutCardIconLarge}>
                              {/* <Text style={styles.workoutCardEmojiLarge}>💪</Text> */}
                              <Dumbbell color="#4CAF50"/>

                            </View>
                            <View style={styles.workoutDetailHeaderContent}>
                              <Text style={styles.workoutDetailTitle}>{workout.name}</Text>
                              <Text style={styles.workoutDetailSubtitle}>
                                {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                              </Text>
                              <Text style={styles.workoutDetailDate}>
                                Created {new Date(workout.createdAt).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Exercise List */}
                          <View style={styles.exerciseListContainer}>
                            <Text style={styles.exercisesTitle}>Exercises:</Text>
                            {workout.exercises.map((exercise, index) => (
                              <View key={exercise.id} style={styles.exerciseItem}>
                                <View style={styles.exerciseNumberContainer}>
                                  <Text style={styles.exerciseNumber}>{index + 1}</Text>
                                </View>
                                <View style={styles.exerciseContent}>
                                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                                  {exercise.sets && (
                                    <Text style={styles.exerciseSets}>{exercise.sets} sets</Text>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                          
                          {/* Start Workout Button */}
                          <TouchableOpacity 
                            style={styles.startWorkoutButton}
                            onPress={() => {
                              router.push({
                                pathname: '/start-workout',
                                params: {
                                  id: workout.id,
                                  fromWorkoutId: workout.id,
                                },
                              });
                            }}
                          >
                            <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })()}
                    
                    {/* Workout History Section */}
                    <View style={styles.workoutHistoryContainer}>
                      <Text style={styles.workoutHistoryTitle}>Workout History</Text>
                      
                      {workoutHistory.length === 0 ? (
                        <View style={styles.emptyHistoryContainer}>
                          <Text style={styles.emptyHistoryText}>No workout logs yet</Text>
                          <Text style={styles.emptyHistorySubtext}>Complete this workout to see your history</Text>
                        </View>
                      ) : (
                        <FlatList
                          data={workoutHistory}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <WorkoutLogCard 
                              log={item} 
                              onPress={() => handleViewLog(item)} 
                            />
                          )}
                          scrollEnabled={false} // Disable scrolling in the FlatList, we're using the parent ScrollView
                          contentContainerStyle={styles.historyListContent}
                        />
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default WorkoutPlansScreen;

const styles = StyleSheet.create({
  containerNightTime: {
    flex: 1,
    backgroundColor: 'rgb(188, 133, 102)',
    marginTop: 0,
  },
  containerDayTime: {
    flex: 1,
    marginTop: 0,
    backgroundColor: 'rgb(217, 148, 100)'
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
    marginTop: '30%'
  },
  header: {
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  // Hero styles - Taking up exactly half the screen height
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    width: '100%',
    zIndex: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  kittenImage: {
    width: '75%',
    height: undefined,
    aspectRatio: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingBottom: 15
  },
  // heroOverlay: {
  //   ...StyleSheet.absoluteFillObject,
  //   // backgroundColor: 'rgba(255, 255, 255, 0.18)',
  // },
  heroContent: {
    position: 'absolute',
    bottom: -100,
    alignSelf: 'center',
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
    paddingTop: '70%',
    zIndex: 1,
  },
  streakCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 5,
    marginTop: 0,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    height: 60,
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
    backgroundColor: '#f8f5e6',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.3)',
  },
  progressContainer: {
    // height: 12,
    // backgroundColor: 'rgba(200, 200, 200, 0.3)',
    // borderRadius: 6,
    // overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: 'rgba(200, 200, 200, 0.5)',
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    height: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    borderRadius: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B9E56A', // mellow green
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  // Workout Panel Button
  workoutPanelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.2)',
  },
  workoutPanelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  // Workout Panel Container - positioned just above nav bar and covering 80% of screen
  workoutPanelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  // Workout Plans Header
  workoutPlansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 8,
    marginTop: 0,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(143, 201, 58, 0.2)',
    position: 'relative',
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    paddingLeft: 30,
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    left: 8,
    padding: 8,
  },
  panelScrollView: {
    flex: 1,
    paddingTop: 15,
    marginTop: 0,
    paddingBottom: 60,
  },
  // Workout Plans Grid
  workoutListContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  workoutCardsGrid: {
    flexDirection: 'column', // Changed to column layout
  },
  workoutPlanCardContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  
  workoutCardActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    padding: 8,
    zIndex: 10,
  },
  workoutCardAction: {
    borderRadius: 12,
    padding: 6,
    marginLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedWorkoutPlanCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  workoutCardEmoji: {
    fontSize: 24,
  },
  workoutPlanCardTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#3b2f2f',
    marginBottom: 2,
  },
  workoutPlanCardSubtitle: {
    fontSize: 14,
    color: '#8f715b',
  },
  workoutCardContent: {
    flex: 1,
  },
  // Workout Detail View
  workoutDetailContainer: {
    paddingHorizontal: 4,
  },
  backButton: {
    paddingVertical: 10,
    marginBottom: 12,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  workoutDetailCard: {
    backgroundColor: '#fffaf3',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutDetailHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  workoutCardIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutCardEmojiLarge: {
    fontSize: 30,
  },
  workoutDetailHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  workoutDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  workoutDetailSubtitle: {
    fontSize: 15,
    color: Colors.gray,
    marginBottom: 2,
  },
  workoutDetailDate: {
    fontSize: 13,
    color: '#b29787',
    fontStyle: 'italic',
  },
  exerciseListContainer: {
    marginBottom: 20,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  exerciseNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  exerciseSets: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  startWorkoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Workout History
  workoutHistoryContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  workoutHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  historyListContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
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
  emptyHistoryContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    minHeight: 120,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
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
    fontWeight: '600',
  },
  workoutPlanCard: {
    backgroundColor: '#fff9f1', // warmer pastel
    borderRadius: 20,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    // backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});