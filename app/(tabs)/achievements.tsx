import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { useUser } from '@/utils/UserContext';
import { Plus } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
  levelRequired: number;
  xpReward: number;
  bounceAnim?: Animated.Value;
  visible?: boolean;
};

export default function AchievementsScreen() {
  const { user, setUser } = useUser();
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalXP, setTotalXP] = useState(120); // This would come from user data in a real app
  const [kittyLevel, setKittyLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0); // 0-100%
  const [nextLevelXP, setNextLevelXP] = useState(0);
  
  // Function to calculate level based on XP
  // Uses an exponential curve to make higher levels harder to reach
  useEffect(() => {
    const calculateLevel = (xp: number) => {
      // Base formula: level = Math.floor(Math.sqrt(xp / 10))
      // This makes each level exponentially harder
      const newLevel = Math.floor(Math.sqrt(xp / 10));
      const maxLevel = Math.max(1, newLevel); // Minimum level is 1
      
      // Calculate XP needed for next level
      const xpForCurrentLevel = Math.pow(maxLevel, 2) * 10;
      const xpForNextLevel = Math.pow(maxLevel + 1, 2) * 10;
      const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
      const currentLevelProgress = (xp - xpForCurrentLevel) / xpNeededForNextLevel * 100;
      
      setKittyLevel(maxLevel);
      setLevelProgress(currentLevelProgress);
      setNextLevelXP(xpNeededForNextLevel);
    };
    
    calculateLevel(totalXP);
  }, [totalXP]);
  
  // All possible achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Workout',
      description: 'Complete your first workout',
      icon: '🏆',
      unlocked: true,
      levelRequired: 1,
      xpReward: 10,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '2',
      title: 'Workout Streak',
      description: 'Complete 3 workouts in a row',
      icon: '🔥',
      unlocked: false,
      progress: 1,
      total: 3,
      levelRequired: 1,
      xpReward: 20,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '3',
      title: 'Muscle Master',
      description: 'Complete 10 different workouts',
      icon: '💪',
      unlocked: false,
      progress: 2,
      total: 10,
      levelRequired: 2,
      xpReward: 50,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '4',
      title: 'Heavy Lifter',
      description: 'Log a workout with weight over 100kg',
      icon: '🏋️',
      unlocked: false,
      levelRequired: 3,
      xpReward: 30,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '5',
      title: 'Dedicated Kitty',
      description: 'Work out 5 times in a single week',
      icon: '😺',
      unlocked: false,
      progress: 2,
      total: 5,
      levelRequired: 2,
      xpReward: 40,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '6',
      title: 'Weekly Warrior',
      description: 'Complete at least one workout a week for 4 consecutive weeks',
      icon: '⚔️',
      unlocked: false,
      progress: 1,
      total: 4,
      levelRequired: 3,
      xpReward: 100,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '7',
      title: 'Consistent Crusader',
      description: 'Complete at least one workout a week for 6 consecutive months',
      icon: '🛡️',
      unlocked: false,
      progress: 0,
      total: 26, // Approximately 6 months of weeks
      levelRequired: 5,
      xpReward: 250,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '8',
      title: 'Annual Athlete',
      description: 'Complete at least one workout a week for 12 consecutive months',
      icon: '🏅',
      unlocked: false,
      progress: 0,
      total: 52, // Approximately 12 months of weeks
      levelRequired: 10,
      xpReward: 500,
      bounceAnim: new Animated.Value(1),
      visible: true
    },
    {
      id: '9',
      title: 'Kitty Caretaker',
      description: 'Keep your kitty healthy for 8 consecutive weeks',
      icon: '😻',
      unlocked: false,
      progress: 3,
      total: 8,
      levelRequired: 4,
      xpReward: 150,
      bounceAnim: new Animated.Value(1),
      visible: true
    }
  ]);
  
  // Filter achievements based on user level
  const visibleAchievements = achievements.filter(
    achievement => achievement.visible && achievement.levelRequired <= kittyLevel + 2
  );
  
  // Count unlocked achievements
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  // Handle claiming an achievement
  const claimAchievement = (id: string) => {
    // Find the achievement
    const achievement = achievements.find(a => a.id === id);
    if (!achievement || !achievement.unlocked) return;
    
    // Start bounce animation
    Animated.sequence([
      Animated.timing(achievement.bounceAnim!, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(achievement.bounceAnim!, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      // After animation, update achievements and show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      
      // Update achievements list - mark as not visible
      setAchievements(prev => 
        prev.map(a => a.id === id ? {...a, visible: false} : a)
      );
      
      // Add XP
      setTotalXP(prev => prev + achievement.xpReward);
    });
  };
  
  // Add custom goal
  const addCustomGoal = () => {
    // In a real app, this would open a modal to create a custom goal
    const newGoal: Achievement = {
      id: `custom-${Date.now()}`,
      title: 'Custom Goal',
      description: 'Your personal fitness goal',
      icon: '🎯',
      unlocked: false,
      levelRequired: kittyLevel,
      xpReward: 30,
      bounceAnim: new Animated.Value(1),
      visible: true
    };
    
    setAchievements(prev => [...prev, newGoal]);
  };

  const renderAchievement = ({ item }: { item: Achievement }) => (
    <Animated.View 
      style={[
        styles.achievementCard, 
        !item.unlocked && styles.lockedCard,
        {
          transform: [{ scale: item.bounceAnim }],
          opacity: item.bounceAnim
        }
      ]}
    >
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
        
        {item.unlocked && (
          <TouchableOpacity 
            style={styles.claimButton}
            onPress={() => claimAchievement(item.id)}
          >
            <Text style={styles.claimButtonText}>Claim {item.xpReward} XP</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!item.unlocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>🔒</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Achievements" />
      
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <LottieView
            source={require('@/assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={styles.confetti}
          />
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <Image 
            source={typeof user?.avatarUrl === 'string' ? { uri: user.avatarUrl } : user?.avatarUrl}
            style={styles.catImage}
          />
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>Level {kittyLevel} Kitty</Text>
            <Text style={styles.statsSubtitle}>
              {unlockedCount}/{achievements.length} Achievements • {totalXP} XP Total
            </Text>
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelProgress}>
                <View 
                  style={[
                    styles.levelProgressFill, 
                    { width: `${levelProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.xpText}>{Math.round(nextLevelXP * (levelProgress/100))}/{nextLevelXP} XP to Level {kittyLevel + 1}</Text>
            </View>
          </View>
        </View>
        
        <FlatList
          data={visibleAchievements}
          keyExtractor={(item) => item.id}
          renderItem={renderAchievement}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <TouchableOpacity style={styles.addGoalButton} onPress={addCustomGoal}>
              <View style={styles.addGoalIcon}>
                <Plus size={20} color={Colors.primary} />
              </View>
              <Text style={styles.addGoalText}>Add Personal Goal</Text>
            </TouchableOpacity>
          }
        />
      </View>
      <SafeAreaView style={styles.bottomSafeArea} edges={[]} />
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
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.2)',
  },
  catImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: Colors.text,
  },
  statsSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 8,
  },
  levelProgressContainer: {
    marginTop: 5,
  },
  levelProgress: {
    height: 10,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
    marginBottom: 5,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  xpText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 100,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.2)',
  },
  lockedCard: {
    opacity: 0.75,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
    backgroundColor: 'rgba(143, 201, 58, 0.15)',
    width: 50,
    height: 50,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 25,
    overflow: 'hidden',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderBottomLeftRadius: 20,
    padding: 8,
  },
  lockedText: {
    fontSize: 16,
  },
  claimButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginTop: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.2)',
    borderStyle: 'dashed',
  },
  addGoalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(143, 201, 58, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addGoalText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  }
});