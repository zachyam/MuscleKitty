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
import ConfettiCannon from 'react-native-confetti-cannon';
import CoinPopup from '@/components/CoinPopup';
import FancyAlert from '@/components/FancyAlert';

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
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const confettiAnimation = useRef<LottieView>(null);
  const [coinsEarned, setCoinsEarned] = useState(5);
  const [showAlert, setShowAlert] = useState(false);

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
          historyData[exercise.id] = history; // keep only the last 10
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
      const coinsToAdd =  Math.floor(((userLevel + 1) ** 2 * 20) / (3 + 0.8 * userLevel) / 5) * 5;
      setCoinsEarned(coinsToAdd)
      console.log("coinsToAdd is: ", coinsToAdd);
      return coinsToAdd;
    }
    console.log("Unable to calculate coinsToAdd. Returning default of 5");
    setCoinsEarned(5)
    return 5;
  }
  const handleFinishWorkout = async () => {
    if (!workout) return;
    
    // Filter out exercises with no sets or all sets have 0 reps
    const completedExercises = exerciseLogs.filter(exercise => 
      exercise.sets.length > 0 && exercise.sets.some(set => set.reps > 0)
    );
    
    if (completedExercises.length === 0) {
      setShowAlert(true);
      console.log(showAlert)
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
    } catch (error) {
      console.error('Error adding coins:', error);
    }
    
    // Show confetti celebration
    setShowConfetti(true);
    setShowCoinPopup(true);
    // if (confettiAnimation.current) {
    //   confettiAnimation.current.play();
    // }
    
    // Navigate to Index tab after a delay to show the completed workout
    setTimeout(() => {
      //setShowConfetti(false);
      router.replace('/(tabs)/');
    }, 2000);
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
      {showAlert && (
        <FancyAlert type={'error'} message="Cannot Save! Please complete at least one exercise set before finishing" onClose={() => setShowAlert(false)} />
      )}
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
                width={350}
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
          <Text style={styles.previousNavButtonText}>Previous</Text>
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
      {showConfetti && (
        <ConfettiCannon
        count={100}
        origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
        fadeOut
        explosionSpeed={300}
        fallSpeed={2000}
        onAnimationEnd={() => setShowConfetti(false)}
        />
      )}

      {/* Coin Popup Celebration Modal */}
      {showCoinPopup && (
        <CoinPopup
          coinsEarned={coinsEarned}
          onComplete={() => setShowCoinPopup(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ✨ Pastel Ghibli-Inspired Style Enhancements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8EC', // warm cream
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#A18A74',
  },
  progressBar: {
    height: 10,
    width: '100%',
    // backgroundColor: '#FDE8D7',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A3C9A8',
    borderBottomEndRadius: 10,
    borderTopEndRadius: 10,
  },
  exerciseHeader: {
    padding: 16,
  },
  exerciseCount: {
    fontWeight: '500',
    fontSize: 14,
    color: '#A18A74',
    marginBottom: 4,
  },
  exerciseName: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#6B4C3B',
  },
  exerciseSets: {
    fontSize: 14,
    color: '#A18A74',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  setsContainer: {
    backgroundColor: '#FFF3DA',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#D7C0AE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  setsHeaderText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#B3907A',
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
    backgroundColor: '#A3C9A8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#8FBF9F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
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
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    padding: 10,
    fontWeight: '500',
    fontSize: 16,
    color: '#6B4C3B',
    textAlign: 'center',
    shadowColor: '#E4DCCF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    borderColor: '#A3C9A8',
    borderRadius: 24,
    marginTop: 12,
    backgroundColor: '#F1FAF0',
  },
  addSetText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#618264',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF8EC',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#FFF8EC', // warm cream
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#F7D9D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  previousNavButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#6B4C3B',
    opacity: 0.5
  },
  navButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#6B4C3B',
  },
  disabledButton: {
    opacity: 0.5,
  },
  finishButton: {
    backgroundColor: '#A3C9A8',
  },
  finishButtonText: {
    color: 'black',
  },
  previousWorkoutContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FDE8D7',
    borderRadius: 16,
    borderColor: '#E5CBAF',
  },
  previousWorkoutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#B3907A',
    marginBottom: 4,
  },
  previousWorkoutDate: {
    fontSize: 14,
    color: '#B3907A',
    marginBottom: 12,
  },
  previousSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5CBAF',
  },
  previousSetText: {
    fontSize: 14,
    color: '#8A7156',
  },
  chartContainer: {
    marginTop: 16,
    // backgroundColor: '#E7F6EC',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#B7D4C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
});
