import React from 'react';
import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkouts, deleteWorkout } from '@/utils/storage';
import { Workout } from '@/types';
import Header from '@/components/Header';
import WorkoutCard from '@/components/WorkoutCard';
import { UserContext } from '@/utils/UserContext';

export default function WorkoutPlansScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);

  // Load workouts when the screen comes into focus or user changes
  useFocusEffect(
    useCallback(() => {
      console.log('WorkoutPlansScreen - useFocusEffect triggered');
      loadWorkouts();
    }, [user?.id]) // Reload when user changes
  );
  
  // Also load on initial mount to ensure data is available
  useEffect(() => {
    console.log('WorkoutPlansScreen - initial mount');
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    setLoading(true);
    // Get only workouts for the current user
    // const savedWorkouts = await generateFakeWorkouts(user?.id);

    // TEMPORARY: Generate fake data for demo purposes - REMOVE THIS LATER
    const { generateFakeWorkouts } = await import('@/utils/storage');
    const savedWorkouts = await generateFakeWorkouts(user?.id);
    

    setWorkouts(savedWorkouts);
    setLoading(false);
  };

  const handleCreateWorkout = () => {
    router.push('/create-workout');
  };

  const handleSelectWorkout = (workout: Workout) => {
    router.push({
      pathname: '/workout-details',
      params: { id: workout.id }
    });
  };

  const handleEditWorkout = (workoutId: string) => {
    router.push({
      pathname: '/edit-workout',
      params: { id: workoutId }
    });
  };

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert(
      'Delete Workout Plan',
      'Are you sure you want to delete this workout plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(workoutId);
            loadWorkouts();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Your Workout Plans" />
      
      <View style={styles.content}>
        {workouts.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Image 
              source={{ uri: 'https://cdn.dribbble.com/userupload/9328318/file/original-372a31363e584305d2763f4f50becddd.jpg' }}
              style={styles.catImage}
            />
            <Text style={styles.emptyText}>No workout plans yet!</Text>
            <Text style={styles.emptySubtext}>Create your first workout plan to start tracking your progress</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Workout Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={workouts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <WorkoutCard 
                  workout={item} 
                  onPress={() => handleSelectWorkout(item)} 
                  onEditPress={() => handleEditWorkout(item.id)}
                  onDeletePress={() => handleDeleteWorkout(item.id)}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
                <Plus size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Workout Plan</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  bottomSafeArea: {
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  catImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  emptyText: {
    fontWeight: 'bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontWeight: '500',
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  }
});