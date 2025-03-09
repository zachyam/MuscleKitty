import React from 'react';
import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ImageBackground } from 'react-native';
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
    <View style={styles.container}>
      {/* Hero Background - Takes up entire top half */}
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: 'https://i.pinimg.com/736x/88/4c/3c/884c3c4285c79df0be1371b5344788da.jpg' }}
          style={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Image source={typeof user?.avatarUrl === 'string' ? { uri: user.avatarUrl } : user?.avatarUrl}
            style={styles.kittenImage} />
          </View>
        </ImageBackground>
      </View>
      
      {/* Content Section - Starts with the streak card overlapping the hero */}
      <SafeAreaView style={styles.safeArea}>        
        <View style={styles.contentContainer}>
          {/* Streak Card - Positioned to overlap with the hero image */}
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.streakInfo}>
                <Text style={styles.fireEmoji}>🔥</Text>
                <Text style={styles.streakText}>Workout Streak: 3 days!</Text>
              </View>
              <View style={styles.streakCounter}>
                <Text style={styles.streakCount}>5/15</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '33%' }]} />
              </View>
            </View>
          </View>
          
          {/* Workout Plans Section */}
          <View style={styles.workoutPlansHeader}>
            <Text style={styles.sectionTitle}>Your Workout Plans</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleCreateWorkout}>
              <Plus size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {workouts.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={styles.emptyText}>No workout plans yet!</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create your first workout plan</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
                <Text style={styles.createButtonText}>Create Workout Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <WorkoutCard 
                  workout={item} 
                  onPress={() => handleSelectWorkout(item)} 
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(244, 244, 220)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  // Hero styles - Taking up exactly half the screen height
  heroContainer: {
    height: '50%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  kittenImage: {
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238, 231, 231, 0.34)',
  },
  heroContent: {
    padding: 20,
    paddingBottom: 60, // Extra padding at bottom for card overlap
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Content container - Starts below hero with streak card overlapping
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: '75%', // Positioned to create overlap with hero
    zIndex: 1,
  },
  streakCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  streakCounter: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakCount: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  workoutPlansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'Colors.text',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  addGoalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addGoalIconText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  addGoalText: {
    fontSize: 16,
    color: Colors.text,
  }
});