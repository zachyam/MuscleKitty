import React from 'react';
import Svg, { Circle, Line, Path, Ellipse } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

interface Props {
  focused: boolean;
}

const FriendsTabIcon: React.FC<Props> = ({ focused }) => {
  const fillColor = focused ? '#FFA8C5' : '#B0B0B0';
  const strokeColor = '#333';
  const blushColor = focused ? '#FFB6C1' : '#D8D8D8';
  const sparkleColor = '#FFFFFF';

  return (
    <View style={styles.iconContainer}>
      <Svg width={45} height={45} viewBox="0 0 64 64" fill="none">
        {/* Raised main pad (uneven triangle shape) */}
        <Path
          d="M24 42 
             Q20 36 26 34 
             Q32 32 38 34 
             Q44 36 40 42 
             Q36 48 32 48 
             Q28 48 24 42 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />

        {/* Pointier toe beans (claw-like) */}
        <Path
          d="M16 30 
             Q16 26 20 24 
             Q24 26 24 30 
             Q22 34 20 33 
             Q18 34 16 30 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.8}
        />
        <Path
          d="M24 25 
             Q24 21 28 20 
             Q32 21 32 25 
             Q30 29 28 28 
             Q26 29 24 25 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.8}
        />
        <Path
          d="M32 25 
             Q32 21 36 20 
             Q40 21 40 25 
             Q38 29 36 28 
             Q34 29 32 25 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.8}
        />
        <Path
          d="M40 30 
             Q40 26 44 24 
             Q48 26 48 30 
             Q46 34 44 33 
             Q42 34 40 30 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.8}
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
