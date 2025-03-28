import React from 'react';
import Svg, { Circle, Ellipse } from 'react-native-svg';

const CoinIcon = ({ width = 35, height = 35 }) => (
    <Svg width={width} height={height} viewBox="0 0 200 200">
    {/* Outer Coin */}
    <Circle cx="100" cy="100" r="95" fill="#5D3700" />
    <Circle cx="100" cy="100" r="85" fill="#FFE066" />
    <Circle cx="100" cy="100" r="65" fill="#FFB800" />

    {/* Highlight */}
    <Ellipse cx="75" cy="75" rx="15" ry="10" fill="#FFE066" opacity="0.5" />

    {/* Kitty Paw Center Pad (larger and shifted slightly down) */}
    <Ellipse cx="100" cy="120" rx="28" ry="22" fill="#FFF0E0" />

    {/* Paw Toes (larger and spaced a bit wider) */}
    <Circle cx="72" cy="95" r="9" fill="#FFF0E0" />
    <Circle cx="90" cy="88" r="9" fill="#FFF0E0" />
    <Circle cx="110" cy="88" r="9" fill="#FFF0E0" />
    <Circle cx="128" cy="95" r="9" fill="#FFF0E0" />
  </Svg>
);

export default CoinIcon;