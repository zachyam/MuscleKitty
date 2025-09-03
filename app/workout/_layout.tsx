import React from 'react';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="create" options={{ animation: 'fade' }} />
      <Stack.Screen name="edit" options={{ animation: 'fade' }} />
      <Stack.Screen name="start" options={{ animation: 'fade' }} />
      <Stack.Screen name="details" options={{ animation: 'fade' }} />
      <Stack.Screen name="logs" options={{ animation: 'fade' }} />
    </Stack>
  );
}