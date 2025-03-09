import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface FadeInOutProps {
  children: React.ReactNode;
  visible: boolean;
  style?: any;
}

export const FadeInOut: React.FC<FadeInOutProps> = ({ children, visible, style }) => {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});