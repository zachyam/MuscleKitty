import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { UserContext } from '@/utils/UserContext';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, X, Trash2, Minus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkoutById, saveWorkout, deleteWorkout } from '@/utils/storageAdapter';
import { Workout, Exercise } from '@/types';
import FancyAlert from '@/components/FancyAlert';

const generateId = () => `exercise_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (id) loadWorkout(id);
  }, [id]);

  const loadWorkout = async (workoutId: string) => {
    setLoading(true);
    const workout = await getWorkoutById(workoutId);
    if (workout) {
      setName(workout.name);
      setExercises([...workout.exercises]);
    }
    setLoading(false);
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) return;
    const newExercise: Exercise = {
      id: generateId(),
      name: newExerciseName.trim(),
      sets: 1,
    };
    setExercises([...exercises, newExercise]);
    setNewExerciseName('');
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const handleIncreaseSets = (id: string) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, sets: (e.sets || 1) + 1 } : e));
  };

  const handleDecreaseSets = (id: string) => {
    setExercises(exercises.map(e => e.id === id && (e.sets || 1) > 1 ? { ...e, sets: e.sets - 1 } : e));
  };

  const smartBack = (id: string) => {
    // Navigate to the log details
    // router.replace({
    //   pathname: '/(tabs)/',
    //   params: { selectedWorkoutId: 0 },
    // });
    router.back();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setShowAlert(true);
      setAlertMessage('Please enter a workout name');
      return;
    }
    if (exercises.length === 0) {
      setShowAlert(true);
      setAlertMessage('Please add at least one exercise');
      return;
    }
    const existingWorkout = await getWorkoutById(id as string);
    const updatedWorkout: Workout = {
      id: id as string,
      name: name.trim(),
      exercises,
      createdAt: existingWorkout?.createdAt || new Date().toISOString(),
      userId: user?.id || existingWorkout?.userId || 'unknown',
    };
    await saveWorkout(updatedWorkout);
    smartBack(updatedWorkout.id);
  };

  const handleDelete = () => {
    Alert.alert('Delete Workout Plan', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteWorkout(id as string);
          smartBack(id as string);
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {showAlert && <FancyAlert type="error" message={alertMessage} onClose={() => setShowAlert(false)} />}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => smartBack(id)} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Workout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => smartBack(id)} style={styles.backButton}>
            <ArrowLeft size={24} color="#6B4C3B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Workout</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Workout Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Upper Body, Leg Day"
            placeholderTextColor="#C7B9A5"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Exercises</Text>
          {exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <View style={styles.exerciseContent}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.setsContainer}>
                  <TouchableOpacity onPress={() => handleDecreaseSets(exercise.id)} disabled={(exercise.sets || 1) <= 1}>
                    <Minus size={16} color={(exercise.sets || 1) <= 1 ? '#C7B9A5' : '#6B4C3B'} />
                  </TouchableOpacity>
                  <Text style={styles.setsText}>{exercise.sets || 1} {(exercise.sets || 1) === 1 ? 'set' : 'sets'}</Text>
                  <TouchableOpacity onPress={() => handleIncreaseSets(exercise.id)}>
                    <Plus size={16} color="#6B4C3B" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemoveExercise(exercise.id)}>
                <X size={18} color="#C25A5A" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addExerciseContainer}>
            <TextInput
              style={styles.exerciseInput}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="Add exercise"
              placeholderTextColor="#C7B9A5"
              onSubmitEditing={handleAddExercise}
            />
            <TouchableOpacity onPress={handleAddExercise} disabled={!newExerciseName.trim()} style={styles.addButton}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveFullButton, (!name.trim() || exercises.length === 0) && styles.disabledButton]} onPress={handleSave} disabled={!name.trim() || exercises.length === 0}>
          <Text style={styles.saveFullButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete Workout Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8EC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    marginBottom: 20
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#6B4C3B',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#6B4C3B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF6EA',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    color: '#6B4C3B',
    borderWidth: 1,
    borderColor: '#E7CBA9',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF6EA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EBD9C2',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    color: '#6B4C3B',
    marginBottom: 4,
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setsText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#A18A74',
  },
  addExerciseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  exerciseInput: {
    flex: 1,
    backgroundColor: '#FFF6EA',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#6B4C3B',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EBD9C2',
  },
  addButton: {
    backgroundColor: '#A3C9A8',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveFullButton: {
    backgroundColor: '#A3C9A8',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveFullButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#C25A5A',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  deleteButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
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
  disabledButton: {
    opacity: 0.5,
  },
});
