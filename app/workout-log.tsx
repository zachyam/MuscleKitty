import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWorkoutLogById, deleteWorkoutLog } from '@/utils/storageAdapter';
import * as SupabaseAPI from '@/utils/supabase';
import { WorkoutLog } from '@/types';
import Header from '@/components/Header';
import React from 'react';

export default function WorkoutLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [loading, setLoading] = useState(true);

  // Use useFocusEffect instead of useEffect to reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("WorkoutLogScreen focused, reloading data for ID:", id);
      if (id) {
        loadWorkoutLog(id);
      }
      return () => {
        // This runs when the screen goes out of focus
        console.log("WorkoutLogScreen unfocused");
      };
    }, [id])
  );

  const loadWorkoutLog = async (logId: string) => {
    console.log(`WorkoutLogScreen: Loading workout log with ID: ${logId}`);
    setLoading(true);
    
    try {
      // First check if this log even exists in the database
      const exists = await SupabaseAPI.checkIfLogExists(logId);
      
      if (!exists) {
        console.error(`WorkoutLogScreen: Log ID ${logId} does not exist in the database`);
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
      
      // Try to get the log details
      const foundLog = await getWorkoutLogById(logId);
      console.log('WorkoutLogScreen: Found log:', foundLog ? JSON.stringify(foundLog, null, 2) : 'null');
      
      if (!foundLog) {
        console.error('WorkoutLogScreen: No workout log found with ID:', logId);
        Alert.alert(
          'Error Loading Details',
          'The workout log exists but its details could not be loaded.',
          [
            { 
              text: 'Go Back', 
              onPress: () => router.back() 
            }
          ]
        );
      }
      
      setLog(foundLog);
    } catch (error) {
      console.error('WorkoutLogScreen: Error loading workout log:', error);
      Alert.alert(
        'Error',
        'An error occurred while loading the workout log.',
        [
          { 
            text: 'Go Back', 
            onPress: () => router.back() 
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEditLog = () => {
    router.push({
      pathname: '/edit-workout-log',
      params: { id: id as string }
    });
  };

  const handleDeleteLog = () => {
    Alert.alert(
      'Delete Workout Log',
      'Are you sure you want to delete this workout log? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutLog(id as string);
            router.back();
          }
        }
      ]
    );
  };

  if (loading || !log) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Workout Log" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout log...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header 
        title="Workout Log" 
        showBackButton 
        rightIcon={
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={handleEditLog} style={styles.actionButton}>
              <Pencil size={22} color="#6B4C3B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteLog} style={styles.actionButton}>
              <Trash2 size={22} color="#D66A6A" />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logHeader}>
          <Text style={styles.workoutName}>{log.workoutName || 'Workout'}</Text>
          <Text style={styles.workoutDate}>{formatDate(log.date || new Date().toISOString())}</Text>
        </View>
        
        <View style={styles.exercisesContainer}>
          {log.exercises && log.exercises.length > 0 ? (
            log.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>{exercise.exerciseName || 'Exercise'}</Text>
                
                <View style={styles.setsContainer}>
                  <View style={styles.setsHeader}>
                    <Text style={styles.setsHeaderText}>Set</Text>
                    <Text style={styles.setsHeaderText}>Reps</Text>
                    <Text style={styles.setsHeaderText}>Weight</Text>
                  </View>
                  
                  {exercise.sets && exercise.sets.length > 0 ? (
                    exercise.sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.setRow}>
                        <Text style={styles.setText}>{set.setNumber || setIndex + 1}</Text>
                        <Text style={styles.setText}>{set.reps || 0}</Text>
                        <Text style={styles.setText}>{set.weight > 0 ? `${set.weight} lbs` : '-'}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptySetRow}>
                      <Text style={styles.emptyText}>No sets recorded</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyExerciseCard}>
              <Text style={styles.emptyText}>No exercises found for this workout</Text>
            </View>
          )}
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Workout Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Exercises:</Text>
            <Text style={styles.summaryValue}>{log.exercises?.length || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Sets:</Text>
            <Text style={styles.summaryValue}>
              {log.exercises?.reduce((total, exercise) => total + (exercise.sets?.length || 0), 0) || 0}
            </Text>
          </View>
        </View>
      </ScrollView>
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8EC', // warm cream
  },
  bottomSafeArea: {
    backgroundColor: '#FFF8EC',
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
  content: {
    flex: 1,
    padding: 16,
  },
  logHeader: {
    backgroundColor: '#FDE8D7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#D7C0AE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  workoutName: {
    fontWeight: '700',
    fontSize: 24,
    color: '#6B4C3B',
    marginBottom: 6,
  },
  workoutDate: {
    fontSize: 14,
    color: '#A18A74',
  },
  exercisesContainer: {
    marginBottom: 24,
  },
  exerciseCard: {
    borderRadius: 20,
    padding: 5,
    marginBottom: 16,
    shadowColor: '#F7D9D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  exerciseName: {
    fontWeight: '700',
    fontSize: 20,
    color: '#6B4C3B',
    marginBottom: 12,
  },
  setsContainer: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    padding: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5E4D7',
    paddingBottom: 8,
  },
  setsHeaderText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    color: '#B3907A',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0,
    borderBottomColor: '#F5E4D7',
  },
  setText: {
    flex: 1,
    fontSize: 14,
    color: '#6B4C3B',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#D8F3DC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#C8E6C9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#386641',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5F7161', 
  },
  summaryValue: {
    fontSize: 14,
    color: '#386641',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  actionButton: {
    padding: 3,
    marginLeft: 8,
  },
  emptyExerciseCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#FDE8D7',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  emptySetRow: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#A18A74',
    fontStyle: 'italic',
  }
});
