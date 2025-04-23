import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Crown, UserPlus, Bell, Check, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/utils/UserContext';
import * as Clipboard from 'expo-clipboard';
import { 
  getFriendProfiles, 
  addFriend as addFriendToSupabase, 
  getCurrentUserKittyHash, 
  getFriendProfileByHash, 
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend as removeFriendFromSupabase,
  FriendProfile,
  FriendshipStatus 
} from '@/utils/friends';
import * as KittyStats from '@/utils/kittyStats';
import FancyAlert from '@/components/FancyAlert';
import { KITTY_IMAGES, KITTY_ID_TO_BREED } from '@/app/name-kitty';

// Define the Friend type that includes what we get from the server
interface Friend {
  id: string;
  fullName: string;
  kittyName: string;
  avatar: any; // Change type to any to accommodate both string and ImageSourcePropType
  level: number;
  xp: number;
  rank?: number;
  kittyHash: string;
  kittyBreed?: string; // Make optional
  kittyBreedId?: string; // Add this property to match what's in the database and user object
  status?: FriendshipStatus;
  userId?: string;  // The DB user_id, needed for friend request operations
}

export default function FriendsScreen() {
  const { user } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [newFriendId, setNewFriendId] = useState<string>("");
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [userRank, setUserRank] = useState<number>(1);
  const [uniqueKittyHash, setUniqueKittyHash] = useState<string>("");
  const [levelProgress, setLevelProgress] = useState(0); // 0-100%
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingFriend, setIsAddingFriend] = useState<boolean>(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hasPendingRequests, setHasPendingRequests] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showAlertMessage, setShowAlertMessage] = useState("")
  const [alertType, setAlertType] = useState<'success' | 'error'>('error')

  // Load user data and friends on component mount
  useEffect(() => {
    const loadUserAndFriends = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Get current user's kitty hash - first try from AsyncStorage
        const kittyHashKey = `${user.email}_${user.id}`;
        let kittyHash = await AsyncStorage.getItem(kittyHashKey);
        
        // If not found in AsyncStorage, try to get from Supabase
        if (!kittyHash) {
          kittyHash = await getCurrentUserKittyHash(user.id);
        }
        
        if (kittyHash) {
          console.log("User Kitty Hash found:", kittyHash);
          setUniqueKittyHash(kittyHash);
        }

        setLevelProgress(KittyStats.calculateLevelProgress(user?.level ?? 1, user?.xp ?? 0));

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
  }, [user?.id, user?.xp, user?.coins]);

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
        fullName: profile.fullName || "Unknown Kitty",
        kittyName: profile.kittyName || "Unknown Kitty",
        avatar: profile.kittyBreedId ? KITTY_IMAGES[profile.kittyBreedId] : KITTY_IMAGES['0'],
        level: profile.level || 1,
        xp: profile.xp || 0,
        kittyHash: profile.kittyHash || "",
        kittyBreed: KITTY_ID_TO_BREED[profile.kittyBreedId || '0'] || "Unknown",
        kittyBreedId: profile.kittyBreedId || "0",
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
        kittyName: profile.kittyName || "Unknown Kitty",
        fullName: profile.fullName || "Unknown Kitty",
        avatar: profile.kittyBreedId ? KITTY_IMAGES[profile.kittyBreedId] : KITTY_IMAGES['0'],
        level: profile.level || 1,
        xp: profile.xp || 0,
        kittyHash: profile.kittyHash || "",
        kittyBreed: KITTY_ID_TO_BREED[profile.kittyBreedId || '0'] || "Unknown",
        kittyBreedId: profile.kittyBreedId || "0",
        userId: profile.userId  // Include userId for API operations
      }));

      // Include the user in the ranking
      const mappedFriendsAndMe: Friend[] = [...mappedFriends, {
        id: user.id,
        kittyName: user.kittyName || "Kitty Name",
        fullName: user.fullName || "You",
        avatar: user.avatarUrl || KITTY_IMAGES[user.kittyBreedId || '0'],
        level: user.level || 1,
        xp: user.xp || 10,
        kittyHash: uniqueKittyHash,
        kittyBreed: KITTY_ID_TO_BREED[user.kittyBreedId || '0'] || "Unknown",
        kittyBreedId: user.kittyBreedId || "0"
      }];
      
      // Sort and assign ranks
      const sortedFriendsAndMe = sortFriendsAndAssignRanks(mappedFriendsAndMe);
      // Remove the user from the list to display the leaderboard
      const sortedFriends = sortedFriendsAndMe.filter(friend => friend.id !== user.id);
      console.log("Sorted Friends:", sortedFriends);
      setFriends(sortedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      setErrorMessage('Failed to load friends. Please try again later.');
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
      await Clipboard.setString(uniqueKittyHash);
      setShowAlert(true);
      setShowAlertMessage("Copied! Your unique kitty ID has been copied to clipboard.");
      setAlertType("success");
    } catch (error) {
      setShowAlert(true);
      setShowAlertMessage("Error! Failed to copy to clipboard.");
      setAlertType("error");
    }
  };
  
  // Function to share user ID via system share dialog
  const shareKittyId = async () => {
    try {
      const result = await Share.share({
        message: `Add me as a friend in MuscleKitty! My Kitty ID is: ${uniqueKittyHash}`,
        title: 'Share My MuscleKitty ID'
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(`Shared via ${result.activityType}`);
        } else {
          // shared
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log('Share was dismissed');
      }
    } catch (error) {
      console.error('Error sharing ID:', error);
      setShowAlert(true);
      setShowAlertMessage("Error! Failed to share your ID. Please try copying it instead.");
      setAlertType("error");
    }
  };

  // Function to add a new friend (sends a friend request)
  const handleAddFriend = async () => {
    if (!newFriendId.trim() || !user?.id) {
      setShowAlert(true);
      setShowAlertMessage("Error! Please enter a friend ID.");
      setAlertType("error");
      return;
    }

    // Check if trying to add self
    if (newFriendId.trim() === uniqueKittyHash) {
      setShowAlert(true);
      setShowAlertMessage("Error! You can't add yourself as a friend.");
      setAlertType("error");
      return;
    }

    // Check if friend already exists
    if (friends.some((friend) => friend.kittyHash === newFriendId.trim())) {
      setShowAlert(true);
      setShowAlertMessage("This kitty is already in your friends list!");
      setAlertType("error");
      return;
    }

    setIsAddingFriend(true);
    
    try {
      // Look up the friend profile by hash
      const friendProfile = await getFriendProfileByHash(newFriendId.trim());
      
      if (!friendProfile) {
        setShowAlert(true);
        setShowAlertMessage("Error! Could not find a kitty with that ID. Please check and try again!");
        setAlertType("error");
        setIsAddingFriend(false);
        return;
      }
      
      // Add the friend request in Supabase
      const success = await addFriendToSupabase(user.id, newFriendId.trim());
      
      if (!success) {
        throw new Error("Failed to send friend request");
      }
      
      setNewFriendId("");
      setShowAlert(true);
      setShowAlertMessage(`Friend request sent to ${friendProfile.kittyName}!`);
      setAlertType("success");
    } catch (error) {
      setShowAlert(true);
      setShowAlertMessage("Error! Failed to send friend request. Please try again later");
      setAlertType("error");
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
      setShowAlert(true);
      setShowAlertMessage("Error! Could not process this friend request. Missing user information");
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
      
      setShowAlert(true);
      setShowAlertMessage(`Success! You are now friends with ${friend.kittyName}!`);
      setAlertType("success");
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setShowAlert(true);
      setShowAlertMessage('Error! Failed to accept friend request. Please try again.');
      setAlertType("error");
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
      setShowAlert(true);
      setShowAlertMessage('Error! Could not process this friend request. Missing user information.');
      setAlertType("error");
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
      
      setShowAlert(true);
      setShowAlertMessage(`Friend request from ${friend.kittyName} has been rejected.`);
      setAlertType("error");
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setShowAlert(true);
      setShowAlertMessage('Error! Failed to reject friend request. Please try again');
      setAlertType("error");
    } finally {
      setIsProcessingRequest(false);
    }
  };
  
  // Handle removing a friend
  const handleRemoveFriend = async (friend: Friend) => {
    if (!user?.id) return;
    
    // We need the kittyHash to remove the friend
    if (!friend.kittyHash) {
      console.error('Missing kittyHash for friend');
      setShowAlert(true);
      setShowAlertMessage('Error! Could not remove this friend. Missing information');
      setAlertType("error");
      return;
    }
    
    try {
      const success = await removeFriendFromSupabase(user.id, friend.kittyHash);
      
      if (!success) {
        throw new Error('Failed to remove friend');
      }
      
      // Remove from friends list
      setFriends(prev => prev.filter(f => f.id !== friend.id));
      
      // Re-sort the leaderboard after removing a friend
      await loadFriends();
      
      setShowAlert(true);
      setShowAlertMessage(`Friend Removed! You are no longer friends with ${friend.kittyName}.`);
      setAlertType("success");
    } catch (error) {
      console.error('Error removing friend:', error);
      setShowAlert(true);
      setShowAlertMessage('Error! Failed to remove friend. Please try again');
      setAlertType("error");
    }
  };

  // Render medal icon based on rank
  const renderRankMedal = (rank: number) => {
    if (rank === 1) return <Crown size={20} color="#FFD700" style={styles.medalIcon} />;
    if (rank === 2) return <Text style={styles.medalIcon}>🥈</Text>
    if (rank === 3) return <Text style={styles.medalIcon}>🥉</Text>
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
          kittyName: user.kittyName || "Kitty Name",
          fullName: user.fullName || "You", 
          avatar: user.avatarUrl || "", 
          level: user.level || 1, 
          xp: user.xp || 10,
          kittyHash: uniqueKittyHash,
          kittyBreedId: user.kittyBreedId || "Unknown"
        }
      ];
      const sorted = sortFriendsAndAssignRanks(allParticipants);
      const userPosition = sorted.findIndex(f => f.id === user.id) + 1;
      setUserRank(userPosition);
    } catch (error) {
      console.error('Error calculating user rank:', error);
    }
  }, [friends, user?.level, user?.xp, user, uniqueKittyHash]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Leaderboard" />
      {showAlert && (
        <FancyAlert type={alertType} message={showAlertMessage} onClose={() => setShowAlert(false)} />
      )}
      <View 
        style={styles.content}
      >
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
                source={user?.avatarUrl 
                  ? (typeof user.avatarUrl === 'string' 
                     ? { uri: user.avatarUrl } 
                     : user.avatarUrl) 
                  : user?.kittyBreedId 
                    ? KITTY_IMAGES[user.kittyBreedId] 
                    : KITTY_IMAGES['0']}
                style={styles.catImage}
                onError={() => console.log('Failed to load avatar image in Friends')}
              />
              <View style={styles.statsInfo}>
                <Text style={styles.statsTitle}>Level {user?.level ?? 1} Kitty</Text>
                <View style={styles.currencyRow}>
                  <View style={styles.currencyItem}>
                    <View style={styles.coinIconWrapper}>
                      <Text style={styles.currencyIcon}>⭐</Text>
                    </View>
                    <Text style={styles.currencyText}>{user?.xp ?? 0} XP</Text>
                    </View>
                  {/* <View style={styles.currencyItem}>
                    <Text style={styles.currencyIcon}>⭐</Text>
                    <Text style={styles.currencyText}>{totalXP} XP</Text>
                  </View> */}
                </View>
                <View style={styles.levelProgressContainer}>
                  <View style={styles.levelProgress}>
                    <View 
                      style={[
                        styles.levelProgressFill, 
                        { width: `${levelProgress}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.xpText}>{KittyStats.calculateCurrentLevelDisplayXP(user?.level ?? 1, user?.xp ?? 0 )}/{KittyStats.calculateTotalLevelDisplayXP(user?.level ?? 1)} XP to Level {(user?.level ?? 1) + 1}</Text>
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
                      <Text style={styles.requestName}>{request.kittyName}</Text>
                      <Text style={styles.profileBio}>{request.fullName}</Text>
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
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.addFriendButton}
                  onPress={() => setAddFriendModalVisible(true)}
                >
                  <UserPlus size={14} color="#FFFFFF" style={{ marginRight: 2 }} />
                  <Text style={styles.addFriendButtonText}>Add</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.addFriendButton, { marginLeft: 4 }]}
                  onPress={shareKittyId}
                >
                  <Text style={styles.addFriendButtonText}>Share ID</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                    <Text style={styles.friendName}>{friend.kittyName}</Text>
                    <Text style={styles.friendName}>{friend.fullName}</Text>
                    <Text style={styles.friendLevel}>Level {friend.level} • {friend.xp} XP</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeFriendButton}
                    onPress={() => {
                      Alert.alert(
                        "Remove Friend",
                        `Are you sure you want to unfriend ${friend.kittyName}? This will remove the friendship for both of you.`,
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          {
                            text: "Unfriend",
                            style: "destructive",
                            onPress: () => handleRemoveFriend(friend)
                          }
                        ]
                      );
                    }}
                  >
                    <X size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}


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

                <TouchableOpacity style={styles.modalShareButton} onPress={shareKittyId}>
                  <Text style={styles.modalCopyButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShareModalVisible(false)}>
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Add Friend Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={addFriendModalVisible}
          onRequestClose={() => setAddFriendModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add a Friend</Text>
              <Text style={styles.modalSubtitle}>
                Enter your friend's Kitty ID below:
              </Text>

              <View style={styles.addFriendModalInputContainer}>
                <TextInput
                  style={styles.addFriendModalInput}
                  placeholder="Enter Kitty ID"
                  placeholderTextColor={Colors.gray}
                  value={newFriendId}
                  onChangeText={setNewFriendId}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                />
              </View>

              <View style={[styles.modalButtons, { marginTop: 0 }]}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, isAddingFriend && styles.disabledButton]}
                  onPress={() => {
                    handleAddFriend();
                    if (!isAddingFriend) {
                      setAddFriendModalVisible(false);
                    }
                  }}
                  disabled={isAddingFriend}
                >
                  {isAddingFriend ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalCopyButtonText, { fontSize: 13 }]}>Send Request</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalCloseButton, { padding: 10 }]}
                  onPress={() => {
                    setAddFriendModalVisible(false);
                    setNewFriendId("");
                  }}
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
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
    backgroundColor: '#FFFBEA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF2D8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D6B8',
    shadowColor: '#C1AC88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  rankBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#7FC37E',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  catImage: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderRadius: 20,
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5E503F',
    marginBottom: 6,
  },
  kittyXP: {
    fontSize: 16,
    color: '#8B6F47',
    fontWeight: '500',
  },
  levelProgressContainer: {
    marginTop: 6,
  },
  levelProgress: {
    height: 10,
    backgroundColor: '#E5DDC4',
    borderRadius: 6,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#A3D977',
    shadowColor: '#A3D977',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  xpText: {
    fontSize: 12,
    color: '#8C7B6D',
    marginTop: 4,
    textAlign: 'right',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  leaderboardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3B31',
    marginTop: 5
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  addFriendButton: {
    backgroundColor: '#7FC37E',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFriendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyFriends: {
    backgroundColor: '#FFF9E7',
    borderRadius: 16,
    padding: 16,
    borderColor: '#E7D4AF',
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  emptyFriendsText: {
    fontSize: 16,
    color: '#8C7B6D',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyFriendsSubtext: {
    fontSize: 14,
    color: '#8C7B6D',
    textAlign: 'center',
  },
  idContainer: {
    backgroundColor: '#FFF4D6',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3CB9F',
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6D5843',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#A89A86',
  },
  idInputContainer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  idInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    color: '#3C2F1C',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    backgroundColor: '#7FC37E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  currencyText: {
    fontSize: 16,
    color: '#8B6F47',
    fontWeight: '500',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  coinIconWrapper: {
    marginRight: 6,
  },
  currencyIcon: {
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    paddingTop: '50%', // Position modal higher on the screen
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%', // Make height smaller
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 12,
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
    flexWrap: 'wrap',
  },
  modalCopyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  modalShareButton: {
    backgroundColor: '#4285F4', // Google blue color
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 8,
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
  addFriendModalInputContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addFriendModalInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15,
    color: Colors.text,
    padding: 6,
    height: 36,
  },
  modalActionButton: {
    backgroundColor: '#7FC37E',
    borderRadius: 12,
    padding: 10,
    flex: 1,
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 0,
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
  removeFriendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    marginLeft: 8,
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
  scrollContent: {
    flex: 1,
  },
  friendsList: {
    marginBottom: 16,
  },
  profileBio: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'left',
  },
  friendCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF2D8',
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
});