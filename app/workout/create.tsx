import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Minus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutService } from '@/app/service';
import { Workout, Exercise } from '@/types';
import { UserContext } from '@/utils/context/UserContext';
import FancyAlert from '@/components/FancyAlert';

const generateId = () => `exercise_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

export default function CreateWorkoutScreen() {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExercisePending, setNewExercisePending] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const { user } = useContext(UserContext);

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: generateId(),
      name: '',
      sets: 1,
    };
    setExercises([...exercises, newExercise]);
    setNewExercisePending(true);
  };

  const handleUpdateExerciseName = (id: string, name: string) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, name } : ex));
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

  const handleSave = async () => {
    if (!name.trim()) {
      setShowAlert(true);
      setAlertMessage('Please enter a workout plan name');
      return;
    }
    const validExercises = exercises.filter(e => e.name.trim());
    if (validExercises.length === 0) {
      setShowAlert(true);
      setAlertMessage('Please add at least one exercise');
      return;
    }
    const newWorkout: Workout = {
      name: name.trim(),
      exercises: validExercises,
      createdAt: new Date().toISOString(),
      userId: user?.id || 'unknown',
    };
    await WorkoutService.saveFormattedWorkout(newWorkout);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {showAlert && <FancyAlert type="error" message={alertMessage} onClose={() => setShowAlert(false)} />}
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#6B4C3B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Workout Plan</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Workout Plan Name</Text>
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
                  <TextInput
                    style={styles.exerciseNameInput}
                    value={exercise.name}
                    onChangeText={(text) => handleUpdateExerciseName(exercise.id, text)}
                    placeholder="Exercise name"
                    placeholderTextColor="#C7B9A5"
                  />
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

            <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
              <Plus size={20} color="#000" />
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.saveFullButton, (exercises.length === 0) && styles.disabledButton]} onPress={handleSave} disabled={exercises.length === 0}>
            <Text style={styles.saveFullButtonText}>Save Workout Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  exerciseNameInput: {
    fontSize: 16,
    color: '#6B4C3B',
    marginBottom: 4,
    paddingVertical: 4,
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  setsText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#A18A74',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A3C9A8',
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  saveFullButton: {
    backgroundColor: '#A3C9A8',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveFullButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
