import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkoutLogById, saveWorkoutLog } from '@/utils/storageAdapter';
import { WorkoutLog, ExerciseLog, SetLog } from '@/types';
import Header from '@/components/Header';
import React from 'react';
import * as SupabaseAPI from '@/utils/supabase';
import FancyAlert from '@/components/FancyAlert';

export default function EditWorkoutLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadWorkoutLog(id);
    }
  }, [id]);

  const loadWorkoutLog = async (logId: string) => {
    console.log(`EditWorkoutLogScreen: Loading workout log with ID: ${logId}`);
    setLoading(true);
    
    try {
      // First check if this log exists in the database
      const exists = await SupabaseAPI.checkIfLogExists(logId);
      
      if (!exists) {
        console.error(`EditWorkoutLogScreen: Log ID ${logId} does not exist in the database`);
        Alert.alert(
          'Log Not Found',
          'This workout log cannot be found. It may have been deleted or the ID is incorrect.',
          [
            { 
              text: 'Go Back', 
              onPress: () => router.back() 
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      const foundLog = await getWorkoutLogById(logId);
      console.log('EditWorkoutLogScreen: Found log:', foundLog ? JSON.stringify(foundLog, null, 2) : 'null');
      
      if (!foundLog) {
        console.error('EditWorkoutLogScreen: No workout log data found with ID:', logId);
        Alert.alert(
          'Error',
          'Could not load workout log details. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        setLoading(false);
        return;
      }
      
      setLog(foundLog);
      setExercises([...foundLog.exercises]);
    } catch (error) {
      console.error('EditWorkoutLogScreen: Error loading workout log:', error);
      Alert.alert(
        'Error',
        'An error occurred while loading the workout log.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    const currentSets = updatedExercises[exerciseIndex].sets;
    const newSetNumber = currentSets.length + 1;
    
    // Copy weight from previous set if available
    const previousWeight = currentSets.length > 0 ? currentSets[currentSets.length - 1].weight : 0;
    
    updatedExercises[exerciseIndex].sets.push({
      setNumber: newSetNumber,
      reps: 0,
      weight: previousWeight,
    });
    
    setExercises(updatedExercises);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    
    // Update set numbers
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.map((set, idx) => ({
      ...set,
      setNumber: idx + 1,
    }));
    
    setExercises(updatedExercises);
  };

  const handleUpdateReps = (exerciseIndex: number, setIndex: number, reps: string) => {
    const repsValue = parseInt(reps) || 0;
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex].reps = repsValue;
    setExercises(updatedExercises);
  };

  const handleUpdateWeight = (exerciseIndex: number, setIndex: number, weight: string) => {
    const weightValue = parseFloat(weight) || 0;
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex].weight = weightValue;
    setExercises(updatedExercises);
  };

  const handleSave = async () => {
    if (!log) return;
    
    // Filter out exercises with no sets or all sets have 0 reps
    const completedExercises = exercises.filter(exercise => 
      exercise.sets.length > 0 && exercise.sets.some(set => set.reps > 0)
    );
    
    if (completedExercises.length === 0) {
      setShowAlert(true);
      setAlertMessage('Cannot Save! Please complete at least one exercise set before saving.');
      return;
    }
    
    const updatedLog: WorkoutLog = {
      ...log,
      exercises: completedExercises,
    };
    
    await saveWorkoutLog(updatedLog);
    router.back();
  };

  if (loading || !log) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Edit Workout Log" showBackButton />
        {showAlert && <FancyAlert type="error" message={alertMessage} onClose={() => setShowAlert(false)} />}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout log...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header 
        title="Edit Workout Log" 
        showBackButton
      />
      
      <View style={styles.logHeader}>
        <Text style={styles.workoutName}>{log.workoutName}</Text>
        <Text style={styles.workoutDate}>{new Date(log.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise, exerciseIndex) => (
        <View key={exerciseIndex} style={{ marginBottom: 24 }}>
            <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
            
            <View style={styles.setsContainer}>
              <View style={styles.setsHeader}>
                <Text style={styles.setsHeaderText}>Set</Text>
                <Text style={styles.setsHeaderText}>Reps</Text>
                <Text style={styles.setsHeaderText}>Weight (lbs)</Text>
                <View style={{ width: 40 }} />
              </View>
              
              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <View style={styles.setNumberContainer}>
                    <Text style={styles.setNumber}>{set.setNumber}</Text>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={set.reps > 0 ? set.reps.toString() : ''}
                      onChangeText={(text) => handleUpdateReps(exerciseIndex, setIndex, text)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.lightGray}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={set.weight > 0 ? set.weight.toString() : ''}
                      onChangeText={(text) => handleUpdateWeight(exerciseIndex, setIndex, text)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.lightGray}
                    />
                  </View>
                  
                  {exercise.sets.length > 1 ? (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveSet(exerciseIndex, setIndex)}
                    >
                      <X size={16} color={Colors.error} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.emptyRemoveButton} />
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.addSetButton}
                onPress={() => handleAddSet(exerciseIndex)}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.addSetText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  logHeader: {
    backgroundColor: '#FDE8D7',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  workoutName: {
    fontWeight: 'bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: Colors.gray,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  exerciseName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#6B4C3B',
    marginBottom: 8,
    marginLeft: 8,
  },
  emptyRemoveButton: {
    width: 40,
    height: 40,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
   // Container for the exercise sets
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
    color: '#A08B71', // soft brown-gray
    flex: 1,
    textAlign: 'center',
  },

  // Each set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  setNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A5C58B', // soft green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  setNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: '#FEF9E6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontWeight: '500',
    fontSize: 16,
    color: '#4E3E2A',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
    color: '#89A96B',
  },

  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});