import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface Props {
  focused: boolean;
}

const ShopTabIcon: React.FC<Props> = ({ focused }) => {
  const fill = focused ? '#B9E56A' : '#CCCCCC';
  const accent = focused ? '#8BC34A' : '#999';

  return (
    <Svg width={30} height={30} viewBox="0 0 64 64" fill="none">
      <Rect
        x="10"
        y="20"
        width="44"
        height="30"
        rx="6"
        fill={fill}
        stroke={accent}
        strokeWidth={3}
      />
      <Path
        d="M16 20V16C16 13.7909 17.7909 12 20 12H44C46.2091 12 48 13.7909 48 16V20"
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx="24" cy="35" r="2" fill={accent} />
      <Circle cx="40" cy="35" r="2" fill={accent} />
    </Svg>
  );
};

export default ShopTabIcon;