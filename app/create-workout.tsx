import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Minus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { saveWorkout } from '@/utils/storage';
import { Workout, Exercise } from '@/types';
import { UserContext } from '@/utils/UserContext';
import FancyAlert from '@/components/FancyAlert';

export default function CreateWorkoutScreen() {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const { user } = useContext(UserContext);

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
      setAlertMessage('Please enter a workout plan name');
      return;
    }
    
    if (exercises.length === 0) {
      setShowAlert(true);
      setAlertMessage('Please add at least one exercise');
      return;
    }
    
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name: name.trim(),
      exercises,
      createdAt: new Date().toISOString(),
      userId: user?.id || 'unknown',
    };
    
    await saveWorkout(newWorkout);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {showAlert && <FancyAlert type="error" message={alertMessage} onClose={() => setShowAlert(false)} />}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout Plan</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Workout Plan Name</Text>
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
          <Text style={styles.saveFullButtonText}>Save Workout Plan</Text>
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
    marginBottom: 40,
  },
  saveFullButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
});