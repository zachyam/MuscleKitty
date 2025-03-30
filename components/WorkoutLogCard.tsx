import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Pencil, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { WorkoutLog } from '@/types';

type WorkoutLogCardProps = {
  log: WorkoutLog;
  onPress: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
};

export default function WorkoutLogCard({ log, onPress, onEditPress, onDeletePress }: WorkoutLogCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Calendar size={24} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{log.workoutName}</Text>
        <Text style={styles.subtitle}>
          {log.exercises.length} {log.exercises.length === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.date}>{formatDate(log.date)}</Text>
        {onEditPress && onDeletePress && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={(e) => {
                e.stopPropagation();
                onEditPress();
              }}
            >
              <Pencil size={18} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={(e) => {
                e.stopPropagation();
                onDeletePress();
              }}
            >
              <Trash2 size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4D6',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  date: {
    fontWeight: '500',
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 6,
  }
});