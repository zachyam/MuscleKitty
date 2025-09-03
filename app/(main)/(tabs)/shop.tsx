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
import { useUser } from '@/utils/context/UserContext';
import * as KittyStats from '@/utils/kittyStats';
import { Dimensions } from 'react-native';
import CoinIcon from '@/components/CoinIcon';
import FancyAlert from '@/components/FancyAlert';
import ConfettiCannon from 'react-native-confetti-cannon';
import XpPopup from '@/components/XpPopup';
import { KITTY_IMAGES } from '@/app/(auth)/onboarding/name-kitty';

const windowWidth = Dimensions.get('window').width;

type ShopItem = {
  id: string;
  name: string;
  description: string;
  image: any;
  price: number; // Price in coins
  xpReward: number; // XP gained when purchased
  category: 'food' | 'toy';
};

export default function ShopScreen() {
  const { user, setUser, addCoins, addXP, updateUserAttributes } = useUser();
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalCoins, setTotalCoins] = useState(user?.coins || 0);
  const [levelProgress, setLevelProgress] = useState(0); // 0-100%
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'food' | 'toy'>('food');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [showXpPopup, setShowXpPopup] = useState(false);

  // Update local state when user data changes
  // useEffect(() => {
  //   if (user) {
  //     console.log('User data updated:', { 
  //       xp: user.xp, 
  //       coins: user.coins, 
  //       level: user.level 
  //     });
  //     setTotalXP(user.xp || 0);
  //     setTotalCoins(user.coins || 0);
  //     setKittyLevel(user.level || 1);
  //   }
  // }, [user?.xp, user?.coins, user?.level]);

  // Calculate level, progress, and XP needed for next level using kittyStats utility
  useEffect(() => {
    setLevelProgress(KittyStats.calculateLevelProgress(user?.level ?? 1, user?.xp ?? 0));
  }, [user?.level, user?.xp]);
  
  // Shop items data
  const shopItems: ShopItem[] = [
    // Food items
    {
      id: 'f1',
      name: 'Premium Kibble',
      description: 'Nutrient-rich dry food for your kitty',
      image: require('@/assets/images/food/cat-kibble.png'),
      price: 10,
      xpReward: 10,
      category: 'food',
    },
    {
      id: 'f2',
      name: 'Gourmet Wet Food',
      description: 'Delicious wet food with real meat chunks',
      image: require('@/assets/images/food/wet-food.png'),
      price: 25,
      xpReward: 30,
      category: 'food',
    },
    {
      id: 'f3',
      name: 'Salmon Treats',
      description: 'Tasty salmon treats for special occasions',
      image: require('@/assets/images/food/salmon-treats-2.png'),
      price: 50,
      xpReward: 65,
      category: 'food',
    },
    {
      id: 'f4',
      name: 'Chicken Dinner',
      description: 'Premium chicken dinner for your kitty',
      image: require('@/assets/images/food/chicken.png'),
      price: 90,
      xpReward: 120,
      category: 'food',
    },
    {
      id: 'f5',
      name: 'Tuna Flakes',
      description: 'Delicious tuna flakes as a special treat',
      image: require('@/assets/images/food/tuna.png'),
      price: 140,
      xpReward: 210,
      category: 'food',
    },
    {
      id: 'f6',
      name: 'Liver Pâté',
      description: 'Rich and tasty liver pâté',
      image: require('@/assets/images/food/liver.png'),
      price: 200,
      xpReward: 320,
      category: 'food',
    },
    {
      id: 'f7',
      name: 'Turkey Feast',
      description: 'Turkey feast for a special holiday meal',
      image: require('@/assets/images/food/turkey.png'),
      price: 300,
      xpReward: 500,
      category: 'food',
    },
    {
      id: 'f8',
      name: 'Beef Strips',
      description: 'Chewy beef strips for strong teeth',
      image: require('@/assets/images/food/beef.png'),
      price: 450,
      xpReward: 780,
      category: 'food',
    },
    {
      id: 'f9',
      name: 'Fish Medley',
      description: 'Varied fish flavors in one package',
      image: require('@/assets/images/food/fish.png'),
      price: 650,
      xpReward: 1200,
      category: 'food',
    },
    
    // Toy items
    {
      id: 't1',
      name: 'Feather Wand',
      description: 'Interactive feather wand to trigger hunting instincts',
      image: require('@/assets/images/toy/feather-wand.png'),
      price: 10,
      xpReward: 10,
      category: 'toy',
    },
    {
      id: 't2',
      name: 'Catnip Mouse',
      description: 'Soft plush mouse filled with premium catnip',
      image: require('@/assets/images/toy/catnip.png'),
      price: 25,
      xpReward: 30,
      category: 'toy',
    },
    {
      id: 't3',
      name: 'Laser Pointer',
      description: 'LED laser toy for exciting chase games',
      image: require('@/assets/images/toy/laser.png'),
      price: 50,
      xpReward: 65,
      category: 'toy',
    },
    {
      id: 't4',
      name: 'Jingle Ball',
      description: 'Colorful ball with internal bell for auditory play',
      image: require('@/assets/images/toy/jingle-bell.png'),
      price: 90,
      xpReward: 130,
      category: 'toy',
    },
    {
      id: 't5',
      name: 'Teaser Ribbon',
      description: 'Wand with colorful ribbons for playful swatting',
      image: require('@/assets/images/toy/ribbon.png'),
      price: 140,
      xpReward: 210,
      category: 'toy',
    },
    {
      id: 't6',
      name: 'Puzzle Box',
      description: 'Treat-dispensing puzzle toy for mental stimulation',
      image: require('@/assets/images/toy/puzzle.png'),
      price: 200,
      xpReward: 320,
      category: 'toy',
    },
    {
      id: 't7',
      name: 'Crinkle Tunnel',
      description: 'Expandable tunnel with crinkly material for hiding and ambushing',
      image: require('@/assets/images/toy/tunnel.png'),
      price: 300,
      xpReward: 500,
      category: 'toy',
    },
    {
      id: 't8',
      name: 'Scratching Post',
      description: 'Sisal-wrapped post for healthy claw maintenance',
      image: require('@/assets/images/toy/scratching-post.png'),
      price: 450,
      xpReward: 780,
      category: 'toy',
    },
    {
      id: 't9',
      name: 'Plush Kicker',
      description: 'Long plush toy perfect for rabbit-kicking and wrestling',
      image: require('@/assets/images/toy/plushie.png'),
      price: 650,
      xpReward: 1200,
      category: 'toy',
    },
  ];
  
  const handlePurchase = (item: ShopItem) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };
  
  const confirmPurchase = async () => {
    if (!user || !selectedItem) return;
    
    const newCoinTotal = (user?.coins ?? 0) - selectedItem.price;
    if (selectedItem && newCoinTotal >= 0) {
      await updateUserAttributes({
        coins: newCoinTotal,
        xp: (user?.xp ?? 0) + selectedItem.xpReward,
        level: KittyStats.calculateLevel((user?.xp ?? 0) + selectedItem.xpReward)
      });
      
      // Update local state
      setTotalCoins(newCoinTotal);
      
      // Show confetti and XP popup
      setShowConfetti(true);
      setShowXpPopup(true);
      
      setIsModalVisible(false);
    } else {
      setIsModalVisible(false);
      setShowAlert(true);
      setAlertType('error');
      setAlertMessage("Insufficient Coins You don't have enough coins to purchase this item!");
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
      <View style={styles.gridItemPriceRow}>
        <View style={styles.gridItemPriceContainer}>
          <View style={styles.miniCoinWrapper}>
            <CoinIcon width={12} height={12}/>
          </View>
          <Text style={styles.gridItemPrice}>{item.price}</Text>
        </View>
        <Text style={styles.gridItemXpReward}>+{item.xpReward} XP</Text>
      </View>
    </TouchableOpacity>
  );

  // Removed renderTabContent - now directly using the FlatList in the main render
  

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Shop" />
      {showAlert && (
        <FancyAlert
          message={alertMessage}
          type={alertType}
          onClose={() => setShowAlert(false)}
        />
      )}
      <View style={styles.overlaysContainer}>
        {/* Confetti Celebration Modal */}
        {showConfetti && (
          <ConfettiCannon
            count={100}
            origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
            fadeOut
            explosionSpeed={300}
            fallSpeed={2000}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        )}
      </View>
      
      {/* XP Popup Celebration Modal */}
      {showXpPopup && (
        <XpPopup
          xpEarned={selectedItem?.xpReward || 0}
          onComplete={() => setShowXpPopup(false)}
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <Image 
            source={user?.avatarUrl 
              ? (typeof user.avatarUrl === 'string' 
                 ? { uri: user.avatarUrl } 
                 : user.avatarUrl) 
              : user?.kittyBreedId 
                ? KITTY_IMAGES[user.kittyBreedId] 
                : KITTY_IMAGES['0']}
            style={styles.catImage}
            onError={() => console.log('Failed to load avatar image in Shop')}
          />
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>Level {user?.level ?? 1} Kitty</Text>
            <View style={styles.currencyRow}>
              <View style={styles.currencyItem}>
                <View style={styles.coinIconWrapper}>
                  <CoinIcon width={25} height={25}/>
                </View>
                <Text style={styles.currencyText}>{totalCoins} Coins</Text>
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
            </View>
            <Text style={styles.xpText}>{KittyStats.calculateCurrentLevelDisplayXP(user?.level ?? 1, user?.xp ?? 0 )}/{KittyStats.calculateTotalLevelDisplayXP(user?.level ?? 1)} XP to Level {(user?.level ?? 1) + 1}</Text>

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
              initialNumToRender={6}
              maxToRenderPerBatch={9}
              windowSize={5}
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
                
                <View style={styles.modalPriceRow}>
                  <View style={styles.modalPriceItem}>
                    <Text style={styles.modalPriceLabel}>Cost:</Text>
                    <View style={styles.modalCoinRow}>
                      <View style={styles.modalCoinWrapper}>
                        <CoinIcon width={20} height={20}/>
                      </View>
                      <Text style={styles.modalItemPrice}>{selectedItem.price} coins</Text>
                    </View>
                  </View>
                  <View style={styles.modalPriceItem}>
                    <Text style={styles.modalPriceLabel}>Reward:</Text>
                    <Text style={styles.modalItemXpReward}>+{selectedItem.xpReward} XP</Text>
                  </View>
                </View>
                
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
                  selectedItem && totalCoins < (selectedItem?.price || 0) && styles.disabledButton
                ]}
                onPress={confirmPurchase}
                disabled={selectedItem ? totalCoins < selectedItem.price : true}
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
    backgroundColor: '#FFFBEA', // soft cream background
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF2D8',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D6B8',
    shadowColor: '#C1AC88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
    height: 140,
  },
  catImage: {
    width: 100,
    height: 100,
    marginBottom: 5,
    marginRight: 15,
    padding: 5,
    resizeMode: 'contain'
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5E503F',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  coinIconWrapper: {
    marginRight: 6,
  },
  currencyText: {
    fontSize: 16,
    color: '#8B6F47',
    fontWeight: '500',
  },
  levelProgressContainer: {
    marginTop: 4,
    borderRadius: 20
  },
  levelProgress: {
    height: 10,
    borderRadius: 20,
    backgroundColor: '#EDE9E0',
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#A3D977',
    shadowColor: '#A3D977',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    borderRadius: 20
  },
  xpText: {
    fontSize: 12,
    color: '#8C7B6D',
    marginTop: 4,
    textAlign: 'right',
  },
  tabContainer: {
    flex: 1,
  },
  customTabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 10,
    borderRadius: 16,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F6EFD9',
    marginHorizontal: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FAD6A5',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C674D',
  },
  activeTabText: {
    color: '#5E503F',
  },
  shopBox: {
    flex: 1,
  },
  gridContent: {
    paddingVertical: 12,
  },
  gridItemCard: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    borderRadius: 16,
    padding: 10,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ECD8B8',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    maxWidth: '100%',
  },
  gridItemImageContainer: {
    width: 50,
    height: 50,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemImage: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  gridItemName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B5847',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridItemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    alignItems: 'center',
    marginTop: 2,
  },
  gridItemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridItemPrice: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#BA8D42',
  },
  gridItemXpReward: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B388EB', // pastel purple XP
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFDF5',
    padding: 24,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4D2B0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5E503F',
    marginBottom: 12,
  },
  modalImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7A6348',
    marginBottom: 4,
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#BA8D42',
  },
  modalItemXpReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B388EB',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0D4C1',
  },
  cancelButtonText: {
    color: '#6A5D4F',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#A3D977',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  modalPriceItem: {
    alignItems: 'center',
  },
  modalPriceLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 2,
  },
  modalCoinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalCoinWrapper: {
    marginRight: 4,
  },
  modalCoinIcon: {
    fontSize: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#7A6348',
    textAlign: 'center',
    marginBottom: 8,
  },
  bottomSafeArea: {
    backgroundColor: '#FFFBEA',
  },
  overlaysContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  miniCoinWrapper: {
    marginRight: 4,
  },
});
