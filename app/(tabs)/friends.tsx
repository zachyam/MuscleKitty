import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, TextInput, Modal, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Award, Users, Crown, Medal } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/utils/UserContext';
// Define the Friend type
interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  rank?: number;
}

export default function FriendsScreen() {
  // Generate a unique ID for the current user
  const [userId, setUserId] = useState<string>("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendId, setNewFriendId] = useState<string>("");
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [userRank, setUserRank] = useState<number>(1);
  const [userLevel, setUserLevel] = useState<number>(5);
  const [userXp, setUserXp] = useState<number>(240);
  const [uniqueKittyHash, setUniqueKittyHash] = useState<string>("");
  const { user } = useUser();
//   const storedKittyName = await AsyncStorage.getItem(userKittyNameKey);
  
  useEffect(() => {
    const loadUniqueKittyHash = async () => {
      if (user?.id) {
        try {
            const kittyHashKey = `${user.kittyName}_${user.id}`;
            const uniqueKittyHash = await AsyncStorage.getItem(kittyHashKey);
            console.log("User Kitty Unique Hash Key:", kittyHashKey);
            console.log("User Kitty Unique Hash:", uniqueKittyHash);
            setUniqueKittyHash(uniqueKittyHash || "");
        } catch (error) {
          console.error('Error loading workout logs:', error);
        }
      }
    };
    
    loadUniqueKittyHash();
  }, [user?.id]);

  // Generate a random ID on component mount
  useEffect(() => {
    // setUserId(`kitty_${Math.random().toString(36).substring(2, 10)}`);

    // Load some sample friends for demonstration with level and XP
    const sampleFriends: Friend[] = [
      {
        id: "kitty_abc123",
        name: "Whiskers",
        avatar: "https://via.placeholder.com/100?text=W",
        level: 8,
        xp: 420,
      },
      {
        id: "kitty_def456",
        name: "Mittens",
        avatar: "https://via.placeholder.com/100?text=M",
        level: 3,
        xp: 120,
      },
      {
        id: "kitty_ghi789",
        name: "Fluffy",
        avatar: "https://via.placeholder.com/100?text=F",
        level: 6,
        xp: 320,
      },
      {
        id: "kitty_jkl012",
        name: "Snowball",
        avatar: "https://via.placeholder.com/100?text=S",
        level: 10,
        xp: 650,
      },
      {
        id: "kitty_mno345",
        name: "Shadow",
        avatar: "https://via.placeholder.com/100?text=S",
        level: 4,
        xp: 180,
      },
    ];
    
    // Sort friends by level in descending order
    const sortedFriends = sortFriendsAndAssignRanks([...sampleFriends]);
    setFriends(sortedFriends);
  }, []);

  // Sort friends by level and assign ranks
  const sortFriendsAndAssignRanks = (friendsList: Friend[]): Friend[] => {
    // Sort by level (descending), then by XP (descending) if levels are equal
    const sorted = [...friendsList].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.xp - a.xp;
    });
    
    // Assign ranks (1, 2, 3, etc.)
    return sorted.map((friend, index) => ({
      ...friend,
      rank: index + 1
    }));
  };

  // Function to copy user ID to clipboard
  const copyIdToClipboard = () => {
    // Clipboard.setString(userId)
    Alert.alert("Copied!", "Your unique ID has been copied to clipboard.");
  };

  // Function to add a new friend
  const addFriend = () => {
    if (!newFriendId.trim()) {
      Alert.alert("Error", "Please enter a friend ID");
      return;
    }

    // Check if friend already exists
    if (friends.some((friend) => friend.id === newFriendId)) {
      Alert.alert("Already friends", "This kitty is already in your friends list!");
      return;
    }

    // In a real app, you would validate the ID and fetch the friend's data
    // For demo purposes, we'll create a random friend
    const randomLevel = Math.floor(Math.random() * 10) + 1;
    const randomXp = randomLevel * 50 + Math.floor(Math.random() * 50);
    
    const newFriend: Friend = {
      id: newFriendId,
      name: `Kitty ${Math.floor(Math.random() * 1000)}`,
      avatar: `https://via.placeholder.com/100?text=${newFriendId.substring(0, 2)}`,
      level: randomLevel,
      xp: randomXp
    };

    // Add new friend and re-sort the list
    const updatedFriends = sortFriendsAndAssignRanks([...friends, newFriend]);
    setFriends(updatedFriends);
    setNewFriendId("");

    Alert.alert("Friend added!", `${newFriend.name} is now your friend!`);
  };

  // Render medal icon based on rank
  const renderRankMedal = (rank: number) => {
    if (rank === 1) return <Crown size={20} color="#FFD700" style={styles.medalIcon} />;
    if (rank === 2) return <Medal size={20} color="#C0C0C0" style={styles.medalIcon} />;
    if (rank === 3) return <Medal size={20} color="#CD7F32" style={styles.medalIcon} />;
    return <Text style={styles.rankText}>#{rank}</Text>;
  };

  // Find the user's position in the leaderboard
  useEffect(() => {
    // In a real app, this would compare the user's level with friends
    // and determine their position
    const allParticipants = [...friends, { id: userId, name: "You", avatar: "", level: userLevel, xp: userXp }];
    const sorted = sortFriendsAndAssignRanks(allParticipants);
    const userPosition = sorted.findIndex(f => f.id === userId) + 1;
    setUserRank(userPosition);
  }, [friends, userLevel, userXp]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Leaderboard" />
      <View style={styles.content}>
        {/* User stats card similar to achievements screen */}
        <View style={styles.statsContainer}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>#{userRank}</Text>
          </View>
          <Image
            source={{ uri: `https://via.placeholder.com/100?text=You` }}
            style={styles.catImage}
          />
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>Level {userLevel} Kitty</Text>
            <Text style={styles.statsSubtitle}>
              Your Rank: #{userRank} • {userXp} XP Total
            </Text>
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelProgress}>
                <View 
                  style={[
                    styles.levelProgressFill, 
                    { width: `${(userXp % 100) / 100 * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.xpText}>{userXp % 100}/100 XP to Level {userLevel + 1}</Text>
            </View>
          </View>
        </View>

        <View style={styles.leaderboardHeader}>
          <View style={styles.leaderboardTitleContainer}>
            <Users size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.leaderboardTitle}>Friend Leaderboard</Text>
          </View>
          <TouchableOpacity 
            style={styles.addFriendButton}
            onPress={() => setShareModalVisible(true)}
          >
            <Text style={styles.addFriendButtonText}>Share ID</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {friends.length === 0 ? (
            <View style={styles.emptyFriends}>
              <Text style={styles.emptyFriendsText}>You haven't added any friends yet.</Text>
              <Text style={styles.emptyFriendsSubtext}>Share your ID or add friends using their kitty ID!</Text>
            </View>
          ) : (
            <View style={styles.friendsList}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendCard}>
                  <View style={styles.rankContainer}>
                    {renderRankMedal(friend.rank || 999)}
                  </View>
                  <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendLevel}>Level {friend.level} • {friend.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addFriendSection}>
            <Text style={styles.sectionTitle}>Add a Friend</Text>
            <View style={styles.addFriendInputContainer}>
              <TextInput
                style={styles.addFriendInput}
                placeholder="Enter friend's kitty ID"
                placeholderTextColor={Colors.gray}
                value={newFriendId}
                onChangeText={setNewFriendId}
              />
              <TouchableOpacity style={styles.addButton} onPress={addFriend}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.idContainer}>
            <View>
              <Text style={styles.sectionTitle}>Your Unique Kitty ID</Text>
              <Text style={styles.sectionSubtitle}>Share this ID with friends so they can add you</Text>
            </View>

            <View style={styles.idInputContainer}>
              <TextInput style={styles.idInput} value={uniqueKittyHash} editable={false} />
              <TouchableOpacity style={styles.copyButton} onPress={copyIdToClipboard}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Share ID Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={shareModalVisible}
          onRequestClose={() => setShareModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Share Your Kitty ID</Text>
              <Text style={styles.modalSubtitle}>
                Share your unique ID with friends so they can add you to their friends list.
              </Text>

              <View style={styles.modalIdContainer}>
                <Text style={styles.modalId}>{userId}</Text>
              </View>

              <Text style={styles.modalInstructions}>
                Ask your friends to enter this ID in their "Add Friend" section.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCopyButton} onPress={copyIdToClipboard}>
                  <Text style={styles.modalCopyButtonText}>Copy to Clipboard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShareModalVisible(false)}>
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 0
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
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
    zIndex: 1,
  },
  rankBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaderboardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addFriendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addFriendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  scrollContent: {
    flex: 1,
  },
  friendsList: {
    marginBottom: 16,
  },
  friendCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  medalIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.gray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  friendInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  friendLevel: {
    fontSize: 12,
    color: Colors.gray,
  },
  addFriendSection: {
    marginVertical: 16,
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 12,
  },
  addFriendInputContainer: {
    flexDirection: 'row',
  },
  addFriendInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  idContainer: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  idInputContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  idInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginLeft: 8,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyFriends: {
    alignItems: 'center',
    padding: 36,
    backgroundColor: Colors.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  emptyFriendsText: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  emptyFriendsSubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 16,
  },
  modalIdContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalInstructions: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCopyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCopyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCloseButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
});