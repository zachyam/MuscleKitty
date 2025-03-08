import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkoutLogById, saveWorkoutLog } from '@/utils/storage';
import { WorkoutLog, ExerciseLog, SetLog } from '@/types';
import Header from '@/components/Header';

export default function EditWorkoutLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadWorkoutLog(id);
    }
  }, [id]);

  const loadWorkoutLog = async (logId: string) => {
    setLoading(true);
    const foundLog = await getWorkoutLogById(logId);
    
    if (foundLog) {
      setLog(foundLog);
      setExercises([...foundLog.exercises]);
    }
    
    setLoading(false);
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
      Alert.alert('Cannot Save', 'Please complete at least one exercise set before saving.');
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
      
      <ScrollView style={styles.content}>
        {exercises.map((exercise, exerciseIndex) => (
          <View key={exerciseIndex} style={styles.exerciseCard}>
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
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
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
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  exerciseName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  setsContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
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
    textAlign: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 10,
    fontWeight: '500',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRemoveButton: {
    width: 40,
    height: 40,
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
    backgroundColor: 'rgba(143, 201, 58, 0.1)',
  },
  addSetText: {
    fontWeight: '500',
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
});