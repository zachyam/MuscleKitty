import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dumbbell, Menu } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Workout } from '@/types';

type WorkoutPlanCardProps = {
  workout: Workout; // Still using Workout type for compatibility
  onPress: () => void;
  onOptionsPress?: () => void;
};

export default function WorkoutCard({ workout, onPress, onOptionsPress }: WorkoutPlanCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Dumbbell size={24} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{workout.name}</Text>
        <Text style={styles.subtitle}>
          {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.date}>{formatDate(workout.createdAt)}</Text>
        {onOptionsPress && (
          <TouchableOpacity 
            style={styles.optionsButton} 
            onPress={(e) => {
              e.stopPropagation();
              onOptionsPress();
            }}
          >
            <Menu size={20} color={Colors.gray} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  optionsButton: {
    padding: 4,
  },
});