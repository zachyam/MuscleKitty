import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
};

export default function AchievementsScreen() {
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Workout',
      description: 'Complete your first workout',
      icon: '🏆',
      unlocked: true,
    },
    {
      id: '2',
      title: 'Workout Streak',
      description: 'Complete 3 workouts in a row',
      icon: '🔥',
      unlocked: false,
      progress: 1,
      total: 3,
    },
    {
      id: '3',
      title: 'Muscle Master',
      description: 'Complete 10 different workouts',
      icon: '💪',
      unlocked: false,
      progress: 2,
      total: 10,
    },
    {
      id: '4',
      title: 'Heavy Lifter',
      description: 'Log a workout with weight over 100kg',
      icon: '🏋️',
      unlocked: false,
    },
    {
      id: '5',
      title: 'Dedicated Kitty',
      description: 'Work out 5 times in a single week',
      icon: '😺',
      unlocked: false,
      progress: 2,
      total: 5,
    },
  ];

  const renderAchievement = ({ item }: { item: Achievement }) => (
    <View style={[styles.achievementCard, !item.unlocked && styles.lockedCard]}>
      <Text style={styles.achievementIcon}>{item.icon}</Text>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDescription}>{item.description}</Text>
        
        {!item.unlocked && item.progress !== undefined && item.total !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(item.progress / item.total) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{item.progress}/{item.total}</Text>
          </View>
        )}
      </View>
      
      {!item.unlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>🔒</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Achievements" />
      
      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <Image 
            source={{ uri: 'https://cdn.dribbble.com/users/1090020/screenshots/15153560/media/cd5df2dcbe6c1f9d21d9ecc6da401a2b.png' }}
            style={styles.catImage}
          />
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>Level 2 Kitty</Text>
            <Text style={styles.statsSubtitle}>1/5 Achievements Unlocked</Text>
            <View style={styles.levelProgress}>
              <View style={styles.levelProgressFill} />
            </View>
          </View>
        </View>
        
        <FlatList
          data={achievements}
          keyExtractor={(item) => item.id}
          renderItem={renderAchievement}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  catImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
  },
  statsSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 8,
  },
  levelProgress: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: {
    width: '20%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  lockedCard: {
    opacity: 0.7,
  },
  achievementIcon: {
    fontSize: 30,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.gray,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontWeight: '500',
    fontSize: 12,
    color: Colors.gray,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderBottomLeftRadius: 16,
    padding: 8,
  },
  lockedText: {
    fontSize: 16,
  },
});