import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface TabBadgeProps {
  count: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'topRight' | 'topLeft';
}

/**
 * A reusable badge component for tabs or icons
 * 
 * @param count The number to display in the badge
 * @param color Background color of the badge (default: red)
 * @param size Size of the badge (small, medium, large)
 * @param position Position of the badge (topRight, topLeft)
 */
const TabBadge: React.FC<TabBadgeProps> = ({ 
  count, 
  color = '#FF3B30', 
  size = 'medium',
  position = 'topRight'
}) => {
  if (count <= 0) return null;
  
  // Get the correct size properties
  const sizeProps = {
    small: { 
      width: 16, 
      height: 16, 
      fontSize: 9, 
      borderWidth: 1,
      top: -4,
      right: -4,
      left: position === 'topLeft' ? -4 : undefined,
    },
    medium: { 
      width: 20, 
      height: 20, 
      fontSize: 10, 
      borderWidth: 1.5,
      top: -6,
      right: -6,
      left: position === 'topLeft' ? -6 : undefined,
    },
    large: { 
      width: 24, 
      height: 24, 
      fontSize: 11, 
      borderWidth: 2,
      top: -8,
      right: -8,
      left: position === 'topLeft' ? -8 : undefined,
    }
  };
  
  const selectedSize = sizeProps[size];
  
  // Format the count for display
  const displayCount = count > 99 ? '99+' : count.toString();
  
  // Adjust width for longer numbers
  const widthAdjustment = displayCount.length > 1 
    ? { width: 'auto', minWidth: selectedSize.width, paddingHorizontal: 4 } 
    : { width: selectedSize.width };
  
  return (
    <View style={[
      styles.badge,
      { 
        backgroundColor: color,
        height: selectedSize.height,
        borderWidth: selectedSize.borderWidth,
        top: selectedSize.top,
        right: position === 'topRight' ? selectedSize.right : undefined,
        left: position === 'topLeft' ? selectedSize.left : undefined,
      },
      widthAdjustment
    ]}>
      <Text style={[styles.badgeText, { fontSize: selectedSize.fontSize }]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TabBadge;