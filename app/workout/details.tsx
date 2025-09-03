import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Play, Pencil, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { LocalStorageService } from '@/app/service';
import { Workout } from '@/types';
import Header from '@/components/Header';

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadWorkout(id);
    }
  }, [id]);

  const loadWorkout = async (workoutId: string) => {
    setLoading(true);
    const foundWorkout = await LocalStorageService.getWorkoutById(workoutId);
    setWorkout(foundWorkout);
    setLoading(false);
  };

  const handleStartWorkout = () => {
    if (workout) {
      router.push({
        pathname: '/workout/start',
        params: { id: workout.id }
      });
    }
  };

  const handleEditWorkout = () => {
    if (workout) {
      router.push({
        pathname: '/workout/edit',
        params: { id: workout.id }
      });
    }
  };

  const handleDeleteWorkout = () => {
    Alert.alert(
      'Delete Workout Plan',
      'Are you sure you want to delete this workout plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await LocalStorageService.deleteWorkout(id as string);
            router.back();
          }
        }
      ]
    );
  };

  if (loading || !workout) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <Header title="Workout Details" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header 
        title={workout.name} 
        showBackButton 
        rightIcon={
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={handleEditWorkout} style={styles.actionButton}>
              <Pencil size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteWorkout} style={styles.actionButton}>
              <Trash2 size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutMeta}>
              {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
            </Text>
          </View>
        </View>
        
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          
          {workout.exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                {exercise.sets && exercise.sets > 1 && (
                  <Text style={styles.exerciseSets}>{exercise.sets} sets</Text>
                )}
              </View>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
          <Play size={20} color="#fff" />
          <Text style={styles.startButtonText}>Start Workout</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workoutHeader: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontWeight: 'bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 14,
    color: Colors.gray,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 12,
  },
  exercisesContainer: {
    marginBottom: 24,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: '500',
    fontSize: 16,
    color: Colors.text,
  },
  exerciseSets: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  startButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  }
});