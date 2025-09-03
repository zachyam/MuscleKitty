import {
  FriendProfile,
  FriendshipStatus,
  registerKittyProfile,
  updateKittyName,
  updateKittyBreed,
  updateKittyStats,
  getFriendProfileByHash,
  addFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendProfiles,
  getPendingFriendRequests,
  getCurrentUserKittyHash,
  getFriendRequestCount
} from '@/app/repository/friends';

export class FriendService {
  static async registerKittyProfile(
    userId: string,
    fullName: string,
    kittyName: string,
    kittyBreedId: string,
    kittyHash: string
  ): Promise<boolean> {
    return registerKittyProfile(userId, fullName, kittyName, kittyBreedId, kittyHash);
  }

  static async updateKittyName(userId: string, kittyName: string): Promise<boolean> {
    return updateKittyName(userId, kittyName);
  }

  static async updateKittyBreed(userId: string, kittyBreedId: string): Promise<boolean> {
    return updateKittyBreed(userId, kittyBreedId);
  }

  static async updateKittyStats(userId: string, level: number, xp: number): Promise<boolean> {
    return updateKittyStats(userId, level, xp);
  }

  static async getFriendProfileByHash(kittyHash: string): Promise<FriendProfile | null> {
    return getFriendProfileByHash(kittyHash);
  }

  static async addFriend(userId: string, friendKittyHash: string): Promise<boolean> {
    return addFriend(userId, friendKittyHash);
  }

  static async acceptFriendRequest(userId: string, requesterUserId: string): Promise<boolean> {
    return acceptFriendRequest(userId, requesterUserId);
  }

  static async rejectFriendRequest(userId: string, requesterUserId: string): Promise<boolean> {
    return rejectFriendRequest(userId, requesterUserId);
  }

  static async removeFriend(userId: string, friendKittyHash: string): Promise<boolean> {
    return removeFriend(userId, friendKittyHash);
  }

  static async getFriendProfiles(userId: string): Promise<FriendProfile[]> {
    return getFriendProfiles(userId);
  }

  static async getPendingFriendRequests(userId: string): Promise<FriendProfile[]> {
    return getPendingFriendRequests(userId);
  }

  static async getCurrentUserKittyHash(userId: string): Promise<string | null> {
    return getCurrentUserKittyHash(userId);
  }

  static async getFriendRequestCount(userId: string): Promise<number> {
    return getFriendRequestCount(userId);
  }

  // Expose the enum for use in components
  static readonly FriendshipStatus = FriendshipStatus;
}