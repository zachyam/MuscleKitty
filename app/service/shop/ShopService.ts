import * as KittyStats from '@/utils/kittyStats';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  image: any;
  price: number; // Price in XP
  xpReward: number; // XP gained when purchased
  category: 'food' | 'toy';
}

export class ShopService {
  // Shop items data - in a real app this could come from a database
  private static shopItems: ShopItem[] = [
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

  static getAllItems(): ShopItem[] {
    return this.shopItems;
  }

  static getItemsByCategory(category: 'food' | 'toy'): ShopItem[] {
    return this.shopItems.filter(item => item.category === category);
  }

  static getItemById(id: string): ShopItem | null {
    return this.shopItems.find(item => item.id === id) || null;
  }

  static canAffordItem(userXP: number, item: ShopItem): boolean {
    return userXP >= item.price;
  }

  static calculatePurchaseResult(userXP: number, item: ShopItem): {
    canAfford: boolean;
    newXP: number;
    newLevel: number;
  } {
    const canAfford = this.canAffordItem(userXP, item);
    
    if (!canAfford) {
      return {
        canAfford: false,
        newXP: userXP,
        newLevel: KittyStats.calculateLevel(userXP)
      };
    }

    const newXP = userXP - item.price + item.xpReward;
    const newLevel = KittyStats.calculateLevel(newXP);

    return {
      canAfford: true,
      newXP,
      newLevel
    };
  }
}