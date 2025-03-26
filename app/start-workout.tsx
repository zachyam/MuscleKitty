import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Check, Plus, Minus, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Colors from '@/constants/Colors';
import { getWorkoutById, saveWorkoutLog, getLatestWorkoutLog, getExerciseHistory } from '@/utils/storage';
import { Workout, WorkoutLog, ExerciseLog, SetLog } from '@/types';
import Header from '@/components/Header';
import { UserContext, useUser } from '@/utils/UserContext';
import ExerciseWeightChart from '@/components/ExerciseWeightChart';

export default function StartWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [previousWorkoutLog, setPreviousWorkoutLog] = useState<WorkoutLog | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<{[key: string]: {date: string, maxWeight: number}[]}>({});
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const { user, addCoins } = useUser(); // Use the custom hook instead of useContext
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [coinsEarned] = useState(100); // Fixed reward of 5 coins per workout
  const confettiAnimation = useRef<LottieView>(null);

  useEffect(() => {
    if (id) {
      loadWorkout(id);
    }
  }, [id]);

  const loadWorkout = async (workoutId: string) => {
    setLoading(true);
    const foundWorkout = await getWorkoutById(workoutId);
    
    if (foundWorkout) {
      setWorkout(foundWorkout);
      
      // Initialize exercise logs with the correct number of sets based on workout definition
      const initialExerciseLogs: ExerciseLog[] = foundWorkout.exercises.map(exercise => {
        const setCount = exercise.sets || 1;
        const initialSets: SetLog[] = [];
        
        for (let i = 0; i < setCount; i++) {
          initialSets.push({ setNumber: i + 1, reps: 0, weight: 0 });
        }
        
        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: initialSets,
        };
      });
      
      setExerciseLogs(initialExerciseLogs);
      
      // Load the most recent workout log for this workout
      if (user?.id) {
        const latestLog = await getLatestWorkoutLog(workoutId, user.id);
        setPreviousWorkoutLog(latestLog);
        
        // Load exercise history for each exercise
        const historyData: {[key: string]: {date: string, maxWeight: number}[]} = {};
        for (const exercise of foundWorkout.exercises) {
          const history = await getExerciseHistory(workoutId, exercise.id, user.id);
          historyData[exercise.id] = history;
        }
        setExerciseHistory(historyData);
      }
    }
    
    setLoading(false);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedLogs = [...exerciseLogs];
    const currentSets = updatedLogs[exerciseIndex].sets;
    const newSetNumber = currentSets.length + 1;
    
    // Copy weight from previous set if available
    const previousWeight = currentSets.length > 0 ? currentSets[currentSets.length - 1].weight : 0;
    
    updatedLogs[exerciseIndex].sets.push({
      setNumber: newSetNumber,
      reps: 0,
      weight: previousWeight,
    });
    
    setExerciseLogs(updatedLogs);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedLogs = [...exerciseLogs];
    updatedLogs[exerciseIndex].sets.splice(setIndex, 1);
    
    // Update set numbers
    updatedLogs[exerciseIndex].sets = updatedLogs[exerciseIndex].sets.map((set, idx) => ({
      ...set,
      setNumber: idx + 1,
    }));
    
    setExerciseLogs(updatedLogs);
  };

  const handleUpdateReps = (exerciseIndex: number, setIndex: number, reps: string) => {
    const repsValue = parseInt(reps) || 0;
    const updatedLogs = [...exerciseLogs];
    updatedLogs[exerciseIndex].sets[setIndex].reps = repsValue;
    setExerciseLogs(updatedLogs);
  };

  const handleUpdateWeight = (exerciseIndex: number, setIndex: number, weight: string) => {
    const weightValue = parseFloat(weight) || 0;
    const updatedLogs = [...exerciseLogs];
    updatedLogs[exerciseIndex].sets[setIndex].weight = weightValue;
    setExerciseLogs(updatedLogs);
  };

  const handleNextExercise = () => {
    if (workout && currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const getCoinsPerWorkout = () => {
    if (user && user.level) {
      const userLevel = user?.level;
      const coinsToAdd =  ((userLevel + 1) ** 2 * 20) / (3 + 0.8 * userLevel);
      console.log("coinsToAdd is {}", coinsToAdd);
    }
    return 5;
  }
  const handleFinishWorkout = async () => {
    if (!workout) return;
    
    // Filter out exercises with no sets or all sets have 0 reps
    const completedExercises = exerciseLogs.filter(exercise => 
      exercise.sets.length > 0 && exercise.sets.some(set => set.reps > 0)
    );
    
    if (completedExercises.length === 0) {
      Alert.alert('Cannot Save', 'Please complete at least one exercise set before finishing.');
      return;
    }
    
    const workoutLog: WorkoutLog = {
      id: Date.now().toString(),
      workoutId: workout.id,
      workoutName: workout.name,
      exercises: completedExercises,
      date: new Date().toISOString(),
      userId: user?.id || 'unknown',
    };
    
    await saveWorkoutLog(workoutLog);
    
    // Add coins to the user's account
    try {
      await addCoins(getCoinsPerWorkout());
      console.log(`Added ${coinsEarned} coins for completing workout`);
    } catch (error) {
      console.error('Error adding coins:', error);
    }
    
    // Show confetti celebration
    setShowConfetti(true);
    if (confettiAnimation.current) {
      confettiAnimation.current.play();
    }
    
    // Navigate to Index tab after a delay to show the completed workout
    setTimeout(() => {
      setShowConfetti(false);
      router.replace('/(tabs)/index');
    }, 3000);
  };

  if (loading || !workout) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <Header title="Start Workout" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get the current exercise and its log
  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentExerciseLog = exerciseLogs[currentExerciseIndex];
  
  // Function to find the previous exercise log from the last workout
  const getPreviousExerciseLog = (exerciseId: string): ExerciseLog | undefined => {
    if (!previousWorkoutLog) return undefined;
    return previousWorkoutLog.exercises.find(ex => ex.exerciseId === exerciseId);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header 
        title={workout.name} 
        showBackButton 
      />
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%` }
          ]} 
        />
      </View>
      
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseCount}>
          Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
        </Text>
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        {currentExercise.sets && currentExercise.sets > 1 && (
          <Text style={styles.exerciseSets}>{currentExercise.sets} sets recommended</Text>
        )}
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setsHeaderText}>Set</Text>
            <Text style={styles.setsHeaderText}>Reps</Text>
            <Text style={styles.setsHeaderText}>Weight</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {currentExerciseLog.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <View style={styles.setNumberContainer}>
                <Text style={styles.setNumber}>{set.setNumber}</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={set.reps > 0 ? set.reps.toString() : ''}
                  onChangeText={(text) => handleUpdateReps(currentExerciseIndex, setIndex, text)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.lightGray}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={set.weight > 0 ? set.weight.toString() : ''}
                  onChangeText={(text) => handleUpdateWeight(currentExerciseIndex, setIndex, text)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.lightGray}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveSet(currentExerciseIndex, setIndex)}
                disabled={currentExerciseLog.sets.length <= 1}
              >
                <X size={16} color={currentExerciseLog.sets.length <= 1 ? Colors.lightGray : Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addSetButton}
            onPress={() => handleAddSet(currentExerciseIndex)}
          >
            <Plus size={16} color={Colors.primary} />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
          
          {/* Previous workout data section */}
          {previousWorkoutLog && getPreviousExerciseLog(currentExercise.id) && (
            <View style={styles.previousWorkoutContainer}>
              <Text style={styles.previousWorkoutTitle}>Previous Workout</Text>
              <Text style={styles.previousWorkoutDate}>
                {new Date(previousWorkoutLog.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              
              {getPreviousExerciseLog(currentExercise.id)?.sets.map((set, index) => (
                <View key={index} style={styles.previousSetRow}>
                  <Text style={styles.previousSetText}>Set {set.setNumber}</Text>
                  <Text style={styles.previousSetText}>{set.reps} reps</Text>
                  <Text style={styles.previousSetText}>{set.weight} {set.weight === 1 ? 'lb' : 'lbs'}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Exercise Weight Progression Chart */}
          {exerciseHistory[currentExercise.id] && (
            <View style={styles.chartContainer}>
              <ExerciseWeightChart
                historyData={exerciseHistory[currentExercise.id]}
                width={Dimensions.get('window').width - 70}
                height={250}
                onPointPress={(date, weight) => {
                  // Pre-format tooltip text immediately
                  const formattedDate = new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  
                  // Set tooltip text and make visible in one update
                  setTooltipText(`${formattedDate}`);
                  setTooltipVisible(true);
                  
                  // Hide tooltip after 2 seconds
                  setTimeout(() => {
                    setTooltipVisible(false);
                  }, 1000);
                }}
              />
              
              {tooltipVisible && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </View>
              )}
            </View>
          )}
        
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navButton, currentExerciseIndex === 0 && styles.disabledButton]}
          onPress={handlePreviousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        {currentExerciseIndex < workout.exercises.length - 1 ? (
          <TouchableOpacity 
            style={styles.navButton}
            onPress={handleNextExercise}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.navButton, styles.finishButton]}
            onPress={handleFinishWorkout}
          >
            <Text style={[styles.navButtonText, styles.finishButtonText]}>Finish</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Confetti Celebration Modal */}
      <Modal
        visible={showConfetti}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.confettiContainer}>
          <LottieView
            ref={confettiAnimation}
            source={require('../assets/animations/confetti.json')}
            style={styles.confettiAnimation}
            autoPlay
            loop={false}
          />
          <View style={styles.congratsCard}>
            <Text style={styles.congratsTitle}>Workout Complete! 🎉</Text>
            <Text style={styles.congratsText}>Great job! You've completed your workout.</Text>
            <View style={styles.coinsEarnedContainer}>
              <Text style={styles.coinsEarnedPrefix}>+{coinsEarned}</Text>
              <View style={styles.coinIconWrapper}>
                <Text style={styles.coinIcon}>🌕</Text>
              </View>
              <Text style={styles.coinsEarnedSuffix}>Coins Earned!</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  exerciseHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseCount: {
    fontWeight: '500',
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  exerciseName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: Colors.text,
  },
  exerciseSets: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  setsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  setsHeaderText: {
    fontWeight: '500',
    fontSize: 14,
    color: Colors.gray,
    flex: 1,
    textAlign: 'left',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  setNumber: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    fontWeight: '500',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  addSetText: {
    fontWeight: '500',
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  navButtonText: {
    fontWeight: '500',
    fontSize: 16,
    color: Colors.text,
  },
  disabledButton: {
    opacity: 0.5,
  },
  finishButton: {
    backgroundColor: Colors.primary,
  },
  finishButtonText: {
    color: '#fff',
  },
  confettiContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  confettiAnimation: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  congratsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  congratsTitle: {
    fontWeight: 'bold',
    fontSize: 24,
    color: Colors.primary,
    marginBottom: 12,
  },
  congratsText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  coinsEarnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  coinsEarnedPrefix: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 5,
  },
  coinsEarnedSuffix: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 5,
  },
  coinIconWrapper: {
    marginRight: 5,
  },
  coinIcon: {
    fontSize: 18,
  },
  previousWorkoutContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.8,
  },
  previousWorkoutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 4,
  },
  previousWorkoutDate: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 12,
  },
  previousSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  previousSetText: {
    fontSize: 14,
    color: Colors.gray,
  },
  chartContainer: {
    position: 'relative',
    marginTop: 16,
  },
  tooltip: {
    position: 'absolute',
    top: 50,
    left: '20%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
    width: '60%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  progressGraphContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressGraphTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  progressGraph: {
    height: 180,
    marginTop: 8,
  },
  graphBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 10,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    width: 18,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  barValue: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 6,
    textAlign: 'center',
    width: 28,
  },
  lineGraphContainer: {
    height: 150,
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  yAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  axisLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  graphContent: {
    flexDirection: 'row',
    height: '100%',
  },
  lineGraph: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  lineSegment: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  pointLabel: {
    position: 'absolute',
    top: -20,
    left: -4,
    fontSize: 12,
    color: Colors.text,
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 10,
    color: Colors.gray,
  },
});