import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';
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
      <Svg width={45} height={45} viewBox="0 0 48 48">
        {/* Head */}
        <Circle cx={24} cy={26} r={10} fill={fillColor} stroke={strokeColor} strokeWidth={1.2} />

        {/* Rounded ears */}
        <Path
          d="M19.2 18 C17.5 15, 16 12, 17.2 11 C18.4 11.8, 19.6 13.8, 20.2 16"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.2}
        />
        <Path
          d="M28.8 18 C30.5 15, 32 12, 30.8 11 C29.6 11.8, 28.4 13.8, 27.8 16"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={1.2}
        />


        {/* Eyes */}
        <Circle cx={20} cy={26} r={1.4} fill={strokeColor} />
        <Circle cx={28} cy={26} r={1.4} fill={strokeColor} />
        <Circle cx={19.5} cy={25.5} r={0.4} fill={sparkleColor} />
        <Circle cx={27.5} cy={25.5} r={0.4} fill={sparkleColor} />

        {/* Nose */}
        <Path d="M23.5 28 Q24 29 24.5 28" stroke={strokeColor} strokeWidth={1} />

        {/* Whiskers - Left */}
        <Line x1={16} y1={24} x2={8} y2={23} stroke={strokeColor} strokeWidth={1} />
        <Line x1={16} y1={26} x2={7} y2={26} stroke={strokeColor} strokeWidth={1} />
        <Line x1={16} y1={28} x2={6} y2={29} stroke={strokeColor} strokeWidth={1} />

        {/* Whiskers - Right */}
        <Line x1={32} y1={24} x2={40} y2={23} stroke={strokeColor} strokeWidth={1} />
        <Line x1={32} y1={26} x2={41} y2={26} stroke={strokeColor} strokeWidth={1} />
        <Line x1={32} y1={28} x2={42} y2={29} stroke={strokeColor} strokeWidth={1} />
        
        {/* Mouth */}
        <Path d="M22.5 29.5 Q24 31.5 25.5 29.5" stroke={strokeColor} strokeWidth={1.2} fill="none" />

        {/* Blush */}
        <Circle cx={17.5} cy={28.5} r={1.1} fill={blushColor} />
        <Circle cx={30.5} cy={28.5} r={1.1} fill={blushColor} />
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
