import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import CoinIcon from '@/components/CoinIcon'

const CoinPopup = ({ coinsEarned, onComplete }: { coinsEarned: number, onComplete?: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -30,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Optional fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }).start(() => onComplete?.());
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.popup,
        {
          opacity: fadeAnim,
          transform: [
            { translateY },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <CoinIcon width={50} height={50} />
      <Text style={styles.text}>You earned +{coinsEarned} coins!</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    top: '40%', // adjust depending on where you want it to appear
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    fontSize: 18,
    marginTop: 4,
    color: '#CC9900', // darker golden color
    fontWeight: 'bold',
  },
});

export default CoinPopup;
