import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabase/supabase';
import { FriendService } from '@/app/service/friend/FriendService';

// Constants
const SELECTED_KITTY_KEY = 'muscle_kitty_selected_mascot';
const KITTY_NAME_KEY = 'muscle_kitty_name';

// Kitty data
export interface KittyProfile {
  id: string;
  breed: string;
  personality: string;
  favoriteToys: string[];
  specialSkills: string[];
  image: any;
  gif?: any;
}

// Kitty images mapping for avatar selection
export const KITTY_IMAGES: Record<string, any> = {
  '0': require('@/assets/images/munchkin.png'),
  '1': require('@/assets/images/orange-tabby.png'),
  '2': require('@/assets/images/russian-blue.png'),
  '3': require('@/assets/images/calico.png'),
  '4': require('@/assets/images/maine-coone.png'),
};

export const KITTY_GIFS: Record<string, any> = {
  '0': require('@/assets/animations/munchkin.gif'),
  '1': require('@/assets/animations/orange-tabby.gif'),
  '2': require('@/assets/animations/russian-blue.gif'),
  '3': require('@/assets/animations/calico.gif'),
  '4': require('@/assets/animations/maine-coone.gif'),
};

// Map kitty ID to breed name
export const KITTY_ID_TO_BREED: Record<string, string> = {
  '0': 'Munchkin',
  '1': 'Orange Tabby',
  '2': 'Russian Blue',
  '3': 'Calico',
  '4': 'Maine Coon',
};

export class OnboardingService {
  static async saveSelectedKitty(userId: string, kittyId: string): Promise<void> {
    if (userId) {
      const userKittyKey = `${SELECTED_KITTY_KEY}_${userId}`;
      await AsyncStorage.setItem(userKittyKey, kittyId);
      console.log(`Saved kitty ID ${kittyId} for user ${userId}`);
    } else {
      // Fallback to the generic key if no user ID (shouldn't happen)
      await AsyncStorage.setItem(SELECTED_KITTY_KEY, kittyId);
      console.log('Saved kitty ID to generic key (no user ID):', kittyId);
    }
  }

  static async getSelectedKitty(userId: string): Promise<string | null> {
    try {
      if (userId) {
        const userKittyKey = `${SELECTED_KITTY_KEY}_${userId}`;
        const storedKittyId = await AsyncStorage.getItem(userKittyKey);
        
        if (storedKittyId) {
          console.log('Retrieved kitty ID:', storedKittyId);
          return storedKittyId;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting selected kitty:', error);
      return null;
    }
  }

  static async saveKittyName(userId: string, kittyName: string): Promise<void> {
    if (userId) {
      const userKittyNameKey = `${KITTY_NAME_KEY}_${userId}`;
      await AsyncStorage.setItem(userKittyNameKey, kittyName.trim());
    }
  }

  static generateKittyHash(str: string): string {
    // Use the original hash algorithm as the base
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    
    // Make sure it's positive by using Math.abs
    const positiveHash = Math.abs(hash);
    
    // Convert to base 36 (numbers and letters) to include characters
    const alphanumericHash = positiveHash.toString(36);
    
    // Add a kitty prefix to the hash
    return 'kitty_' + alphanumericHash;
  }

  static async completeKittyNaming(
    userId: string, 
    userEmail: string,
    userFullName: string,
    kittyName: string, 
    kittyId: string
  ): Promise<{ success: boolean; kittyHash?: string; error?: string }> {
    try {
      // Store the kitty name
      await this.saveKittyName(userId, kittyName);

      // Generate kitty hash - will be used for friend connections
      const kittyHashKey = `${userEmail}_${userId}`;
      const userKittyNameKey = `${KITTY_NAME_KEY}_${userId}`;
      const kittyNameHash = this.generateKittyHash(userKittyNameKey);
      const kittyNameHashString = kittyNameHash.toString();
      await AsyncStorage.setItem(kittyHashKey, kittyNameHashString);
      console.log("User Kitty Unique Hash:", kittyNameHashString);
      
      // Register kitty profile in Supabase for friend search
      await FriendService.registerKittyProfile(
        userId,
        userFullName || "Unknown Kitty",
        kittyName.trim(),
        kittyId,
        kittyNameHashString
      );
      
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: { 
          kittyName: kittyName.trim(),
          fullName: userFullName || "Unknown Kitty",
          kittyId: kittyId,
          kittyBreedId: kittyId,
          kittyHash: kittyNameHashString
        }
      });
      
      if (error) {
        console.error('Error updating user metadata:', error);
        return { 
          success: false, 
          error: 'Failed to update user metadata' 
        };
      }

      return { 
        success: true, 
        kittyHash: kittyNameHashString 
      };
    } catch (error) {
      console.error('Error completing kitty naming:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static getKittyImage(kittyId: string): any {
    return KITTY_IMAGES[kittyId] || null;
  }

  static getKittyGif(kittyId: string): any {
    return KITTY_GIFS[kittyId] || null;
  }

  static getKittyBreedName(kittyId: string): string {
    return KITTY_ID_TO_BREED[kittyId] || 'Unknown';
  }

  static validateKittyName(name: string): boolean {
    return name.trim().length > 0;
  }
}