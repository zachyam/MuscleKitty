import React from 'react';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="adopt-kitty" options={{ animation: 'fade' }} />
      <Stack.Screen name="name-kitty" options={{ animation: 'fade' }} />
    </Stack>
  );
}