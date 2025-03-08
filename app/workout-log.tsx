import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkoutLogById, deleteWorkoutLog } from '@/utils/storage';
import { WorkoutLog } from '@/types';
import Header from '@/components/Header';
import React from 'react';

export default function WorkoutLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadWorkoutLog(id);
    }
  }, [id]);

  const loadWorkoutLog = async (logId: string) => {
    setLoading(true);
    const foundLog = await getWorkoutLogById(logId);
    setLog(foundLog);
    setLoading(false);
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
              <Pencil size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteLog} style={styles.actionButton}>
              <Trash2 size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.logHeader}>
          <Text style={styles.workoutName}>{log.workoutName}</Text>
          <Text style={styles.workoutDate}>{formatDate(log.date)}</Text>
        </View>
        
        <View style={styles.exercisesContainer}>
          {log.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              
              <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                  <Text style={styles.setsHeaderText}>Set</Text>
                  <Text style={styles.setsHeaderText}>Reps</Text>
                  <Text style={styles.setsHeaderText}>Weight</Text>
                </View>
                
                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={styles.setText}>{set.setNumber}</Text>
                    <Text style={styles.setText}>{set.reps}</Text>
                    <Text style={styles.setText}>{set.weight > 0 ? `${set.weight} lbs` : '-'}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Workout Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Exercises:</Text>
            <Text style={styles.summaryValue}>{log.exercises.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Sets:</Text>
            <Text style={styles.summaryValue}>
              {log.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}
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
  content: {
    flex: 1,
    padding: 16,
  },
  logHeader: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
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
  exercisesContainer: {
    marginBottom: 24,
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
    borderRadius: 8,
    padding: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  setsHeaderText: {
    flex: 1,
    fontWeight: '500',
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  setText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  summaryTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray, 
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
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