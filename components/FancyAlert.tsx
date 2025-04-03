import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type FancyAlertProps = {
  message: string;
  type?: 'success' | 'error';
  onClose?: () => void;
};

const FancyAlert = ({ message, type = 'success', onClose }: FancyAlertProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const theme = {
    success: {
      backgroundColor: '#D0F0C0', // minty green
      shadowColor: '#77DD77',
      textColor: '#2E7D32',
    },
    error: {
      backgroundColor: '#FF6B6B', // soft red
      shadowColor: '#FF3B30',
      textColor: '#FFF',
    },
  }[type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onClose?.());
      }, 2500);
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        {
          backgroundColor: theme.backgroundColor,
          shadowColor: theme.shadowColor,
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.messageText, { color: theme.textColor }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 20,
    zIndex: 999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: width * 0.6,
  },
});

export default FancyAlert;
