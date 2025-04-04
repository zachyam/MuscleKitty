import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, X, Trash2, Minus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkoutById, saveWorkout, deleteWorkout } from '@/utils/storage';
import { Workout, Exercise } from '@/types';
import FancyAlert from '@/components/FancyAlert';

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadWorkout(id);
    }
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
    if (!newExerciseName.trim()) {
      return;
    }
    
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName.trim(),
      sets: 1
    };
    
    setExercises([...exercises, newExercise]);
    setNewExerciseName('');
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(exercise => exercise.id !== id));
  };

  const handleIncreaseSets = (id: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === id) {
        return {
          ...exercise,
          sets: (exercise.sets || 1) + 1
        };
      }
      return exercise;
    }));
  };

  const handleDecreaseSets = (id: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === id && exercise.sets && exercise.sets > 1) {
        return {
          ...exercise,
          sets: exercise.sets - 1
        };
      }
      return exercise;
    }));
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
    
    const updatedWorkout: Workout = {
      id: id as string,
      name: name.trim(),
      exercises,
      createdAt: (await getWorkoutById(id as string))?.createdAt || new Date().toISOString(),
    };
    
    await saveWorkout(updatedWorkout);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Workout Plan',
      'Are you sure you want to delete this workout plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(id as string);
            router.back();
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {showAlert && <FancyAlert type="error" message={alertMessage} onClose={() => setShowAlert(false)} />}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Workout Plan</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Workout</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Workout Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Upper Body, Leg Day"
            placeholderTextColor={Colors.lightGray}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Exercises</Text>
          
          {exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <View style={styles.exerciseContent}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.setsContainer}>
                  <TouchableOpacity 
                    onPress={() => handleDecreaseSets(exercise.id)}
                    style={[styles.setButton, (exercise.sets || 1) <= 1 && styles.disabledButton]}
                    disabled={(exercise.sets || 1) <= 1}
                  >
                    <Minus size={16} color={(exercise.sets || 1) <= 1 ? Colors.lightGray : Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.setsText}>{exercise.sets || 1} {(exercise.sets || 1) === 1 ? 'set' : 'sets'}</Text>
                  <TouchableOpacity 
                    onPress={() => handleIncreaseSets(exercise.id)}
                    style={styles.setButton}
                  >
                    <Plus size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => handleRemoveExercise(exercise.id)}
                style={styles.removeButton}
              >
                <X size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.addExerciseContainer}>
            <TextInput
              style={styles.exerciseInput}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="Add exercise"
              placeholderTextColor={Colors.lightGray}
              onSubmitEditing={handleAddExercise}
            />
            <TouchableOpacity 
              onPress={handleAddExercise}
              style={styles.addButton}
              disabled={!newExerciseName.trim()}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.saveFullButton, (!name.trim() || exercises.length === 0) && styles.disabledButton]}
          onPress={handleSave}
          disabled={!name.trim() || exercises.length === 0}
        >
          <Text style={styles.saveFullButtonText}>Save Changes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontWeight: '500',
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontWeight: '500',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  setsText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: Colors.gray,
  },
  removeButton: {
    padding: 4,
  },
  addExerciseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveFullButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  saveFullButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: Colors.error,
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
    color: Colors.gray,
  },
});