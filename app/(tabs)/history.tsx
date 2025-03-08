import { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { getWorkoutLogs, deleteWorkoutLog } from '@/utils/storage';
import { WorkoutLog } from '@/types';
import Header from '@/components/Header';
import WorkoutLogCard from '@/components/WorkoutLogCard';
import { UserContext } from '@/utils/UserContext';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);

  // Load logs when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [user?.id]) // Reload when user changes
  );

  const loadLogs = async () => {
    setLoading(true);
    // Get only logs for the current user
    const savedLogs = await getWorkoutLogs(user?.id);
    // Sort logs by date (newest first)
    savedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLogs(savedLogs);
    setLoading(false);
  };

  const handleViewLog = (log: WorkoutLog) => {
    router.push({
      pathname: '/workout-log',
      params: { id: log.id }
    });
  };

  const handleEditLog = (logId: string) => {
    router.push({
      pathname: '/edit-workout-log',
      params: { id: logId }
    });
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert(
      'Delete Workout Log',
      'Are you sure you want to delete this workout log? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutLog(logId);
            loadLogs();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>      
      <Header title="Your History" />

      <View style={styles.content}>
        {logs.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            
            <Image 
              source={{ uri: 'https://cdn.dribbble.com/userupload/9328318/file/original-372a31363e584305d2763f4f50becddd.jpg' }}
              style={styles.catImage}
            />
            <Text style={styles.emptyText}>No workout history yet!</Text>
            <Text style={styles.emptySubtext}>Complete a workout to see your progress here</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <WorkoutLogCard 
                log={item} 
                onPress={() => handleViewLog(item)} 
                onEditPress={() => handleEditLog(item.id)}
                onDeletePress={() => handleDeleteLog(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
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
    paddingBottom: 20,
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
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
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
  }
});