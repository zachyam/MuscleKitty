import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, TextInput, Modal, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Award, Users, Crown, Medal, UserPlus, Bell, Check, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/utils/UserContext';
import { 
  getFriendProfiles, 
  addFriend as addFriendToSupabase, 
  getCurrentUserKittyHash, 
  getFriendProfileByHash, 
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  FriendProfile,
  FriendshipStatus 
} from '@/utils/friends';
// Define the Friend type that includes what we get from the server
interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  rank?: number;
  kittyHash: string;
  kittyType: string;
  status?: FriendshipStatus;
  userId?: string;  // The DB user_id, needed for friend request operations
}

// Map kitty type to avatar image
const KITTY_IMAGES: Record<string, any> = {
  'Munchkin': require('@/assets/images/munchkin.png'),
  'Orange Tabby': require('@/assets/images/orange-tabby.png'),
  'Russian Blue': require('@/assets/images/russian-blue.png'),
  'Calico': require('@/assets/images/calico.png'),
  'Maine Coon': require('@/assets/images/maine-coon.png'),
  'Unknown': 'https://via.placeholder.com/100?text=K'
};

export default function FriendsScreen() {
  const { user } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [newFriendId, setNewFriendId] = useState<string>("");
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [userRank, setUserRank] = useState<number>(1);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userXp, setUserXp] = useState<number>(0);
  const [uniqueKittyHash, setUniqueKittyHash] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingFriend, setIsAddingFriend] = useState<boolean>(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hasPendingRequests, setHasPendingRequests] = useState<boolean>(false);
  
  // Load user data and friends on component mount
  useEffect(() => {
    const loadUserAndFriends = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Get current user's kitty hash - first try from AsyncStorage
        const kittyHashKey = `${user.kittyName}_${user.id}`;
        let kittyHash = await AsyncStorage.getItem(kittyHashKey);
        
        // If not found in AsyncStorage, try to get from Supabase
        if (!kittyHash) {
          kittyHash = await getCurrentUserKittyHash(user.id);
        }
        
        if (kittyHash) {
          console.log("User Kitty Hash found:", kittyHash);
          setUniqueKittyHash(kittyHash);
        }

        // Set user's level and XP (in a real app, this would come from the backend)
        setUserLevel(user.level || 1);
        setUserXp(user.xp || 0);

        // Load friends and pending requests from Supabase
        await Promise.all([
          loadFriends(),
          loadPendingRequests()
        ]);
      } catch (error) {
        console.error('Error loading user and friends:', error);
        setErrorMessage('Failed to load friends. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndFriends();
  }, [user?.id]);
  
  // Load pending friend requests
  const loadPendingRequests = async () => {
    if (!user?.id) return;
    
    try {
      // Get pending friend requests
      const requests = await getPendingFriendRequests(user.id);
      
      if (requests.length === 0) {
        setPendingRequests([]);
        setHasPendingRequests(false);
        return;
      }
      
      // Map to our Friend interface
      const mappedRequests: Friend[] = requests.map(profile => ({
        id: profile.id,
        name: profile.kittyName || "Unknown Kitty",
        avatar: profile.kittyType ? KITTY_IMAGES[profile.kittyType] : KITTY_IMAGES.Unknown,
        level: profile.level || 1,
        xp: profile.xp || 0,
        kittyHash: profile.kittyHash || "",
        kittyType: profile.kittyType || "Unknown",
        status: FriendshipStatus.PENDING,
        userId: profile.userId  // Make sure to include the userId for friend request handling
      }));
      
      setPendingRequests(mappedRequests);
      setHasPendingRequests(mappedRequests.length > 0);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  // Load friends from Supabase
  const loadFriends = async () => {
    if (!user?.id) return;
    
    try {
      // Get friend profiles from Supabase
      const profiles = await getFriendProfiles(user.id);
      
      if (profiles.length === 0) {
        // No friends yet, return empty list
        setFriends([]);
        return;
      }
      
      // Map to our Friend interface
      const mappedFriends: Friend[] = profiles.map(profile => ({
        id: profile.id,
        name: profile.kittyName || "Unknown Kitty",
        avatar: profile.kittyType ? KITTY_IMAGES[profile.kittyType] : KITTY_IMAGES.Unknown,
        level: profile.level || 1,
        xp: profile.xp || 0,
        kittyHash: profile.kittyHash || "",
        kittyType: profile.kittyType || "Unknown",
        userId: profile.userId  // Include userId for API operations
      }));
      
      // Sort and assign ranks
      const sortedFriends = sortFriendsAndAssignRanks(mappedFriends);
      setFriends(sortedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      setErrorMessage('Failed to load friends. Please try again later.');
      
      // If no friends loaded yet, show sample friends for demo purposes
      if (friends.length === 0) {
        const sampleFriends: Friend[] = [
          {
            id: "sample1",
            name: "Whiskers",
            avatar: KITTY_IMAGES['Calico'],
            level: 8,
            xp: 420,
            kittyHash: "sample1",
            kittyType: "Calico"
          },
          {
            id: "sample2",
            name: "Mittens",
            avatar: KITTY_IMAGES['Russian Blue'],
            level: 3,
            xp: 120,
            kittyHash: "sample2",
            kittyType: "Russian Blue"
          },
          {
            id: "sample3",
            name: "Fluffy",
            avatar: KITTY_IMAGES['Maine Coon'],
            level: 6,
            xp: 320,
            kittyHash: "sample3",
            kittyType: "Maine Coon"
          }
        ];
        const sortedFriends = sortFriendsAndAssignRanks(sampleFriends);
        setFriends(sortedFriends);
      }
    }
  };

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
  const copyIdToClipboard = async () => {
    try {
    //   await Clipboard.setStringAsync(uniqueKittyHash);
      Alert.alert("Copied!", "Your unique kitty ID has been copied to clipboard.");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert("Error", "Failed to copy to clipboard.");
    }
  };

  // Function to add a new friend (sends a friend request)
  const handleAddFriend = async () => {
    if (!newFriendId.trim() || !user?.id) {
      Alert.alert("Error", "Please enter a friend ID");
      return;
    }

    // Check if trying to add self
    if (newFriendId.trim() === uniqueKittyHash) {
      Alert.alert("Can't add yourself", "You can't add yourself as a friend!");
      return;
    }

    // Check if friend already exists
    if (friends.some((friend) => friend.kittyHash === newFriendId.trim())) {
      Alert.alert("Already friends", "This kitty is already in your friends list!");
      return;
    }

    setIsAddingFriend(true);
    
    try {
      // Look up the friend profile by hash
      const friendProfile = await getFriendProfileByHash(newFriendId.trim());
      
      if (!friendProfile) {
        Alert.alert("Friend Not Found", "Could not find a kitty with that ID. Please check and try again.");
        setIsAddingFriend(false);
        return;
      }
      
      // Add the friend request in Supabase
      const success = await addFriendToSupabase(user.id, newFriendId.trim());
      
      if (!success) {
        throw new Error("Failed to send friend request");
      }
      
      setNewFriendId("");
      Alert.alert("Request sent!", `Friend request sent to ${friendProfile.kittyName}!`);
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert("Error", "Failed to send friend request. Please try again later.");
    } finally {
      setIsAddingFriend(false);
    }
  };
  
  // Handle accepting a friend request
  const handleAcceptRequest = async (friend: Friend) => {
    if (!user?.id) return;
    
    // We need the userId of the requester, not the profile id
    if (!friend.userId) {
      console.error('Missing userId in friend request');
      Alert.alert('Error', 'Could not process this friend request. Missing user information.');
      return;
    }
    
    setIsProcessingRequest(true);
    
    try {
      const success = await acceptFriendRequest(user.id, friend.userId);
      
      if (!success) {
        throw new Error('Failed to accept friend request');
      }
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== friend.id));
      
      // Add to friends list
      const newFriend: Friend = {
        ...friend,
        status: FriendshipStatus.ACCEPTED
      };
      
      // Add to friends and re-sort
      const updatedFriends = sortFriendsAndAssignRanks([...friends, newFriend]);
      setFriends(updatedFriends);
      
      // Update pending requests flag
      setHasPendingRequests(pendingRequests.length > 1);
      
      Alert.alert('Success', `You are now friends with ${friend.name}!`);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    } finally {
      setIsProcessingRequest(false);
    }
  };
  
  // Handle rejecting a friend request
  const handleRejectRequest = async (friend: Friend) => {
    if (!user?.id) return;
    
    // We need the userId of the requester, not the profile id
    if (!friend.userId) {
      console.error('Missing userId in friend request');
      Alert.alert('Error', 'Could not process this friend request. Missing user information.');
      return;
    }
    
    setIsProcessingRequest(true);
    
    try {
      const success = await rejectFriendRequest(user.id, friend.userId);
      
      if (!success) {
        throw new Error('Failed to reject friend request');
      }
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== friend.id));
      
      // Update pending requests flag
      setHasPendingRequests(pendingRequests.length > 1);
      
      Alert.alert('Rejected', `Friend request from ${friend.name} has been rejected.`);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request. Please try again.');
    } finally {
      setIsProcessingRequest(false);
    }
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
    // Skip if we don't have user data yet
    if (!user || !user.kittyName) return;
    
    try {
      // Include the user in the ranking
      const allParticipants = [
        ...friends, 
        { 
          id: user.id, 
          name: user.kittyName || "You", 
          avatar: user.avatarUrl || "", 
          level: userLevel, 
          xp: userXp,
          kittyHash: uniqueKittyHash,
          kittyType: user.kittyBreed || "Unknown"
        }
      ];
      const sorted = sortFriendsAndAssignRanks(allParticipants);
      const userPosition = sorted.findIndex(f => f.id === user.id) + 1;
      setUserRank(userPosition);
    } catch (error) {
      console.error('Error calculating user rank:', error);
    }
  }, [friends, userLevel, userXp, user, uniqueKittyHash]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Leaderboard" />
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading friends...</Text>
          </View>
        ) : (
          <>
            {/* User stats card similar to achievements screen */}
            <View style={styles.statsContainer}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>#{userRank}</Text>
              </View>
              {hasPendingRequests && (
                <View style={styles.notificationBadge}>
                  <Bell size={15} color="#FFFFFF" />
                </View>
              )}
              <Image
                source={user?.avatarUrl ? 
                  (typeof user.avatarUrl === 'string' ? { uri: user.avatarUrl } : user.avatarUrl) :
                  { uri: `https://via.placeholder.com/100?text=You` }}
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
            
            {/* Pending Friend Requests Section */}
            {hasPendingRequests && (
              <View style={styles.requestsContainer}>
                <View style={styles.requestsHeader}>
                  <Bell size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.requestsTitle}>Friend Requests</Text>
                  <View style={styles.requestCountBadge}>
                    <Text style={styles.requestCountText}>{pendingRequests.length}</Text>
                  </View>
                </View>
                
                {pendingRequests.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <Image source={request.avatar} style={styles.requestAvatar} />
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{request.name}</Text>
                      <Text style={styles.requestLevel}>Level {request.level} • {request.xp} XP</Text>
                    </View>
                    
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptRequest(request)}
                        disabled={isProcessingRequest}
                      >
                        {isProcessingRequest ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Check size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectRequest(request)}
                        disabled={isProcessingRequest}
                      >
                        {isProcessingRequest ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <X size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

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
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

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
                  <Image source={friend.avatar} style={styles.avatar} />
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
              <TouchableOpacity 
                style={[styles.addButton, isAddingFriend && styles.disabledButton]}
                onPress={handleAddFriend}
                disabled={isAddingFriend}
              >
                {isAddingFriend ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
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
                <Text style={styles.modalId}>{uniqueKittyHash}</Text>
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
          </>
        )}
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
  notificationBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FF6B6B',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.gray,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Friend request styles
  requestsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  requestCountBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  requestLevel: {
    fontSize: 12,
    color: Colors.gray,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  rejectButton: {
    backgroundColor: '#FF6B6B',
  },
});