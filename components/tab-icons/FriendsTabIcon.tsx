import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

interface Props {
  focused: boolean;
}

const FriendsTabIcon: React.FC<Props> = ({ focused }) => {
  return (
    <View style={styles.iconContainer}>
      <Svg width={30} height={30} viewBox="0 0 48 48">
        <Circle
          cx={24}
          cy={24}
          r={22}
          fill={focused ? '#FFDFBA' : '#E0E0E0'}
        />
        <Path
          d="M24 24c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6z"
          fill={focused ? '#FF8A65' : '#888'}
        />
        <Path
          d="M12 36c0-4 8-6 12-6s12 2 12 6v2H12v-2z"
          fill={focused ? '#FF7043' : '#999'}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FriendsTabIcon;
