import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated } from 'react-native';
import { Dumbbell, HouseIcon, Trophy, User, ShoppingCart, PersonStanding } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in when the component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Tabs
        id="app-tabs" // Add a stable ID for the tabs
        initialRouteName="index" // Explicitly set the initial route
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            ...styles.tabBar,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: 'rgb(40, 40, 37), 0.12)',
          tabBarInactiveTintColor: 'rgb(148, 148, 131), 0.12)',
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: {
            flex: 1, // This ensures each tab takes equal space
            justifyContent: 'center',
            alignItems: 'center',
          },
          swipeEnabled: false, // Disable swiping between tabs
          unmountOnBlur: false, // Keep tab screens mounted
          freezeOnBlur: true, // Freeze screens when they lose focus
          
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HouseIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <PersonStanding size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgb(242, 242, 201), 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});