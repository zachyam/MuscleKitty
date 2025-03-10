import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Modal, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed TabView imports since we're using a custom tab implementation
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { useUser } from '@/utils/UserContext';
import LottieView from 'lottie-react-native';
import { Dimensions } from 'react-native';

const windowWidth = Dimensions.get('window').width;

type ShopItem = {
  id: string;
  name: string;
  description: string;
  image: any;
  price: number;
  category: 'food' | 'toy';
};

export default function ShopScreen() {
  const { user, setUser } = useUser();
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalXP, setTotalXP] = useState(120); // This would come from user data in a real app
  const [kittyLevel, setKittyLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0); // 0-100%
  const [nextLevelXP, setNextLevelXP] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'food' | 'toy'>('food');
  
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
  
  // Shop items data
  const shopItems: ShopItem[] = [
    // Food items
    {
      id: 'f1',
      name: 'Premium Kibble',
      description: 'Nutrient-rich dry food for your kitty',
      image: require('@/assets/images/orange-tabby.png'),
      price: 10,
      category: 'food',
    },
    {
      id: 'f2',
      name: 'Gourmet Wet Food',
      description: 'Delicious wet food with real meat chunks',
      image: require('@/assets/images/maine-coon.png'),
      price: 15,
      category: 'food',
    },
    {
      id: 'f3',
      name: 'Salmon Treats',
      description: 'Tasty salmon treats for special occasions',
      image: require('@/assets/images/russian-blue.png'),
      price: 20,
      category: 'food',
    },
    {
      id: 'f4',
      name: 'Chicken Dinner',
      description: 'Premium chicken dinner for your kitty',
      image: require('@/assets/images/calico.png'),
      price: 25,
      category: 'food',
    },
    {
      id: 'f5',
      name: 'Tuna Flakes',
      description: 'Delicious tuna flakes as a special treat',
      image: require('@/assets/images/munchkin.png'),
      price: 18,
      category: 'food',
    },
    {
      id: 'f6',
      name: 'Liver Pâté',
      description: 'Rich and tasty liver pâté',
      image: require('@/assets/images/orange-tabby.png'),
      price: 22,
      category: 'food',
    },
    {
      id: 'f7',
      name: 'Turkey Feast',
      description: 'Turkey feast for a special holiday meal',
      image: require('@/assets/images/maine-coon.png'),
      price: 28,
      category: 'food',
    },
    {
      id: 'f8',
      name: 'Beef Strips',
      description: 'Chewy beef strips for strong teeth',
      image: require('@/assets/images/russian-blue.png'),
      price: 15,
      category: 'food',
    },
    {
      id: 'f9',
      name: 'Fish Medley',
      description: 'Varied fish flavors in one package',
      image: require('@/assets/images/calico.png'),
      price: 30,
      category: 'food',
    },
    
    // Toy items
    {
      id: 't1',
      name: 'Feather Wand',
      description: 'Interactive feather wand to trigger hunting instincts',
      image: require('@/assets/images/calico.png'),
      price: 25,
      category: 'toy',
    },
    {
      id: 't2',
      name: 'Catnip Mouse',
      description: 'Soft plush mouse filled with premium catnip',
      image: require('@/assets/images/munchkin.png'),
      price: 30,
      category: 'toy',
    },
    {
      id: 't3',
      name: 'Laser Pointer',
      description: 'LED laser toy for exciting chase games',
      image: require('@/assets/images/orange-tabby.png'),
      price: 40,
      category: 'toy',
    },
    {
      id: 't4',
      name: 'Jingle Ball',
      description: 'Colorful ball with internal bell for auditory play',
      image: require('@/assets/images/maine-coon.png'),
      price: 15,
      category: 'toy',
    },
    {
      id: 't5',
      name: 'Teaser Ribbon',
      description: 'Wand with colorful ribbons for playful swatting',
      image: require('@/assets/images/russian-blue.png'),
      price: 20,
      category: 'toy',
    },
    {
      id: 't6',
      name: 'Puzzle Box',
      description: 'Treat-dispensing puzzle toy for mental stimulation',
      image: require('@/assets/images/calico.png'),
      price: 35,
      category: 'toy',
    },
    {
      id: 't7',
      name: 'Crinkle Tunnel',
      description: 'Expandable tunnel with crinkly material for hiding and ambushing',
      image: require('@/assets/images/munchkin.png'),
      price: 45,
      category: 'toy',
    },
    {
      id: 't8',
      name: 'Scratching Post',
      description: 'Sisal-wrapped post for healthy claw maintenance',
      image: require('@/assets/images/orange-tabby.png'),
      price: 50,
      category: 'toy',
    },
    {
      id: 't9',
      name: 'Plush Kicker',
      description: 'Long plush toy perfect for rabbit-kicking and wrestling',
      image: require('@/assets/images/maine-coon.png'),
      price: 28,
      category: 'toy',
    },
  ];
  
  const handlePurchase = (item: ShopItem) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };
  
  const confirmPurchase = () => {
    if (selectedItem && totalXP >= selectedItem.price) {
      setTotalXP(prevXP => prevXP - selectedItem.price);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      
      // Here you would save the purchase to user's inventory
      
      setIsModalVisible(false);
      Alert.alert(
        'Purchase Successful!',
        `You've purchased ${selectedItem.name} for your kitty!`,
      );
    } else {
      setIsModalVisible(false);
      Alert.alert(
        'Insufficient XP',
        'You don\'t have enough XP to purchase this item.',
      );
    }
  };
  
  const renderShopItemGrid = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity 
      style={styles.gridItemCard} 
      onPress={() => handlePurchase(item)}
      activeOpacity={0.8}
    >
      <View style={styles.gridItemImageContainer}>
        <Image source={item.image} style={styles.gridItemImage} />
      </View>
      <Text style={styles.gridItemName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
      <Text style={styles.gridItemPrice}>{item.price} XP</Text>
    </TouchableOpacity>
  );

  // Removed renderTabContent - now directly using the FlatList in the main render
  



  return (
    <SafeAreaView style={styles.container}>
      <Header title="Shop" />
      
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
            <Text style={styles.statsSubtitle}>{totalXP} XP Available</Text>
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
        
        <View style={styles.tabContainer}>
          <View style={styles.customTabBar}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'food' && styles.activeTabButton]} 
              onPress={() => setActiveTab('food')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'food' && styles.activeTabText]}>Food</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'toy' && styles.activeTabButton]} 
              onPress={() => setActiveTab('toy')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'toy' && styles.activeTabText]}>Toys</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.shopBox}>
            <FlatList
              data={shopItems.filter(item => item.category === activeTab)}
              keyExtractor={item => item.id}
              renderItem={renderShopItemGrid}
              contentContainerStyle={styles.gridContent}
              numColumns={3}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
      
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            {selectedItem && (
              <>
                <Image source={selectedItem.image} style={styles.modalImage} />
                <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                <Text style={styles.modalItemPrice}>{selectedItem.price} XP</Text>
                <Text style={styles.modalDescription}>{selectedItem.description}</Text>
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  selectedItem && totalXP < selectedItem.price && styles.disabledButton
                ]}
                onPress={confirmPurchase}
                disabled={selectedItem ? totalXP < selectedItem.price : true}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
    paddingBottom: 0,
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
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
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
  customTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(143, 201, 58, 0.2)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray,
  },
  activeTabText: {
    color: Colors.primary,
  },
  tabContainer: {
    flex: 1,
    paddingBottom: 0,
  },
  shopBox: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(143, 201, 58, 0.2)',
    flex: 1, // Fill available space
    overflow: 'hidden',
  },
  gridContent: {
    paddingVertical: 12,
  },
  gridItemCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 6,
    margin: 4,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.15)',
    height: 105,
    maxWidth: '31%',
  },
  gridItemImageContainer: {
    width: 55,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridItemImage: {
    width: 45,
    height: 45,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  gridItemName: {
    fontWeight: 'bold',
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
    height: 28, // Fixed height to ensure consistent card size
    overflow: 'hidden',
    paddingHorizontal: 2,
  },
  gridItemPrice: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  // Keep the original item card styles for the modal
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(143, 201, 58, 0.2)',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 15,
    marginRight: 16,
    backgroundColor: 'rgba(143, 201, 58, 0.1)',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  buyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: Colors.gray,
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.text,
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(143, 201, 58, 0.1)',
    resizeMode: 'contain',
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: Colors.gray,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});