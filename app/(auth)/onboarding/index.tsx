import React from 'react';
import { View } from 'react-native';
import OnboardingScreen from '@/components/OnboardingScreen';

export default function OnboardingPage() {
  // No splash screen on onboarding - it's already shown in the signup process
  return (
    <View style={{ flex: 1 }}>
      <OnboardingScreen />
    </View>
  );
}