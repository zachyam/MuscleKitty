import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { View } from 'react-native';

interface Props {
  focused: boolean;
}

const HomeTabIcon: React.FC<Props> = ({ focused }) => {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={45} height={45} viewBox="0 0 64 64" fill="none">
          {/* House base */}
          <Path
            d="M20 35 L32 24 L44 35 V48 H20 Z"
            fill={focused ? '#F7B267' : '#BDBDBD'}
            stroke="#5D4037"
            strokeWidth="3"
          />
  
          {/* Door */}
          <Rect x="28" y="40" width="8" height="8" rx="1" fill="#5D4037" />
  
          {/* Roof */}
          <Path
            d="M16 36 L32 20 L48 36"
            fill="none"
            stroke="#8D6E63"
            strokeWidth="3.5"
          />
        </Svg>
      </View>
    );
  };
  

export default HomeTabIcon;


// import React from 'react';
// import Svg, { Path, Circle, Rect } from 'react-native-svg';

// interface Props {
//   focused: boolean;
// }

// const HomeTabIcon: React.FC<Props> = ({ focused }) => {
//   const fill = focused ? '#FFD36E' : '#B0B0B0';
//   const stroke = focused ? '#FFA500' : '#888';

//   return (
//     <Svg width={28} height={28} viewBox="0 0 64 64" fill="none">
//       <Path
//         d="M12 26L32 10L52 26V52C52 53.1046 51.1046 54 50 54H14C12.8954 54 12 53.1046 12 52V26Z"
//         fill={fill}
//         stroke={stroke}
//         strokeWidth={2}
//         strokeLinejoin="round"
//       />
//       <Rect x="26" y="36" width="12" height="18" rx="2" fill="#FFF5D6" stroke={stroke} strokeWidth={1.5} />
//     </Svg>
//   );
// };

// export default HomeTabIcon;
