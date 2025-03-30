import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  focused: boolean;
}

const ProfileTabIcon: React.FC<Props> = ({ focused }) => {
  const fill = focused ? '#FFB6C1' : '#D3D3D3';
  const stroke = focused ? '#FF69B4' : '#999';

  return (
    <Svg width={28} height={28} viewBox="0 0 64 64" fill="none">
      <Circle
        cx="32"
        cy="24"
        r="10"
        fill={fill}
        stroke={stroke}
        strokeWidth={3}
      />
      <Path
        d="M16 52C16 42.0589 24.0589 34 34 34H38C47.9411 34 56 42.0589 56 52"
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default ProfileTabIcon;