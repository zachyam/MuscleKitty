import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import React from 'react';

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Achievements" />
      
      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80' }}
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  catImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: 'bold',
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
    fontSize: 16,
    color: Colors.text,
    fontWeight: 'bold',
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
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
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